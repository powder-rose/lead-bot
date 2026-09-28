import unzipper from "unzipper";
import sax from "sax";

import {
    normalizeDomain,
    normalizeWebsite,
} from "../utils/domain.js";

import {
    getDomainRejectReason,
} from "./domainFilters.js";

import {
    selectBusinessWebsite,
} from "./selectBusinessWebsite.js";


const WORKSHEET_PATH =
    "xl/worksheets/sheet1.xml";

const SHARED_STRINGS_PATH =
    "xl/sharedStrings.xml";


const clean = (
    value = ""
) =>
    String(value)
        .replace(/\s+/g, " ")
        .trim();


const splitValues = (
    value = ""
) =>
    String(value)
        .split(/[\n\r;,]+/)
        .map(clean)
        .filter(Boolean);


const getColumnFromRef = (
    reference = ""
) => {
    const match =
        String(reference)
            .toUpperCase()
            .match(/^([A-Z]+)/);

    return match
        ? match[1]
        : "";
};


const getPrimaryDomain = (
    rawWebsite = ""
) => {
    for (
        const value of
        splitValues(
            rawWebsite
        )
    ) {
        const website =
            normalizeWebsite(
                value
            );

        const domain =
            normalizeDomain(
                website
            );

        if (
            domain &&
            domain.includes(".")
        ) {
            return domain;
        }
    }

    return "";
};


const openEntry = async (
    filePath,
    entryPath
) => {
    const directory =
        await unzipper.Open.file(
            filePath
        );

    const entry =
        directory.files.find(
            (
                file
            ) =>
                file.path ===
                entryPath
        );

    if (!entry) {
        throw new Error(
            `В XLSX не найден ${entryPath}`
        );
    }

    return entry.stream();
};


const collectWebsiteReferences =
    async ({
        filePath,
        websiteColumn,
        headerRow,
        onDirectValue,
    }) => {
        const input =
            await openEntry(
                filePath,
                WORKSHEET_PATH
            );

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const parser =
                    sax.createStream(
                        true,
                        {
                            trim: false,
                            normalize: false,
                        }
                    );

                const sharedIndexCounts =
                    new Map();

                let currentRow =
                    0;

                let currentCell =
                    null;

                let readingValue =
                    false;

                let readingInlineText =
                    false;


                parser.on(
                    "opentag",
                    (
                        node
                    ) => {
                        if (
                            node.name ===
                            "row"
                        ) {
                            currentRow =
                                Number(
                                    node.attributes
                                        .r
                                ) ||
                                0;
                        }


                        if (
                            node.name ===
                            "c"
                        ) {
                            const reference =
                                node.attributes
                                    .r ||
                                "";

                            const column =
                                getColumnFromRef(
                                    reference
                                );


                            if (
                                currentRow >
                                    headerRow &&
                                column ===
                                    websiteColumn
                            ) {
                                currentCell = {
                                    type:
                                        node.attributes
                                            .t ||
                                        "",

                                    value:
                                        "",

                                    inlineValue:
                                        "",
                                };
                            } else {
                                currentCell =
                                    null;
                            }
                        }


                        if (
                            node.name ===
                                "v" &&
                            currentCell
                        ) {
                            readingValue =
                                true;
                        }


                        if (
                            node.name ===
                                "t" &&
                            currentCell &&
                            currentCell.type ===
                                "inlineStr"
                        ) {
                            readingInlineText =
                                true;
                        }
                    }
                );


                parser.on(
                    "text",
                    (
                        text
                    ) => {
                        if (
                            readingValue &&
                            currentCell
                        ) {
                            currentCell.value +=
                                text;
                        }


                        if (
                            readingInlineText &&
                            currentCell
                        ) {
                            currentCell.inlineValue +=
                                text;
                        }
                    }
                );


                parser.on(
                    "closetag",
                    (
                        name
                    ) => {
                        if (
                            name ===
                            "v"
                        ) {
                            readingValue =
                                false;
                        }


                        if (
                            name ===
                            "t"
                        ) {
                            readingInlineText =
                                false;
                        }


                        if (
                            name ===
                                "c" &&
                            currentCell
                        ) {
                            if (
                                currentCell.type ===
                                "s"
                            ) {
                                const index =
                                    Number(
                                        currentCell.value
                                    );

                                if (
                                    Number.isInteger(
                                        index
                                    )
                                ) {
                                    sharedIndexCounts.set(
                                        index,
                                        (
                                            sharedIndexCounts.get(
                                                index
                                            ) ||
                                            0
                                        ) +
                                            1
                                    );
                                } else {
                                    onDirectValue(
                                        ""
                                    );
                                }
                            } else {
                                const value =
                                    currentCell.type ===
                                    "inlineStr"
                                        ? currentCell.inlineValue
                                        : currentCell.value;

                                onDirectValue(
                                    value
                                );
                            }

                            currentCell =
                                null;
                        }
                    }
                );


                parser.on(
                    "error",
                    reject
                );


                input.on(
                    "error",
                    reject
                );


                parser.on(
                    "end",
                    () => {
                        resolve(
                            sharedIndexCounts
                        );
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const processSelectedSharedStrings =
    async ({
        filePath,
        sharedIndexCounts,
        onValue,
    }) => {
        if (
            !sharedIndexCounts.size
        ) {
            return {
                resolvedOccurrences:
                    0,
            };
        }


        let input;

        try {
            input =
                await openEntry(
                    filePath,
                    SHARED_STRINGS_PATH
                );
        } catch {
            return {
                resolvedOccurrences:
                    0,
            };
        }


        return new Promise(
            (
                resolve,
                reject
            ) => {
                const parser =
                    sax.createStream(
                        true,
                        {
                            trim: false,
                            normalize: false,
                        }
                    );

                let sharedIndex =
                    -1;

                let capture =
                    false;

                let readingText =
                    false;

                let currentValue =
                    "";

                let resolvedOccurrences =
                    0;


                parser.on(
                    "opentag",
                    (
                        node
                    ) => {
                        if (
                            node.name ===
                            "si"
                        ) {
                            sharedIndex +=
                                1;

                            capture =
                                sharedIndexCounts.has(
                                    sharedIndex
                                );

                            currentValue =
                                "";
                        }


                        if (
                            node.name ===
                                "t" &&
                            capture
                        ) {
                            readingText =
                                true;
                        }
                    }
                );


                parser.on(
                    "text",
                    (
                        text
                    ) => {
                        if (
                            capture &&
                            readingText
                        ) {
                            currentValue +=
                                text;
                        }
                    }
                );


                parser.on(
                    "closetag",
                    (
                        name
                    ) => {
                        if (
                            name ===
                            "t"
                        ) {
                            readingText =
                                false;
                        }


                        if (
                            name ===
                                "si" &&
                            capture
                        ) {
                            const occurrences =
                                sharedIndexCounts.get(
                                    sharedIndex
                                ) ||
                                0;

                            onValue(
                                currentValue,
                                occurrences
                            );

                            resolvedOccurrences +=
                                occurrences;

                            capture =
                                false;
                        }
                    }
                );


                parser.on(
                    "error",
                    reject
                );


                input.on(
                    "error",
                    reject
                );


                parser.on(
                    "end",
                    () => {
                        resolve({
                            resolvedOccurrences,
                        });
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


export const analyze2gisXlsx =
    async ({
        filePath,
        websiteColumn,
        headerRow,
        totalRowsInSheet,
        existingDomains =
            new Set(),
    }) => {
        if (
            !websiteColumn
        ) {
            throw new Error(
                "В XLSX не найдена колонка сайта"
            );
        }


        const totalRows =
            totalRowsInSheet
                ? Math.max(
                      totalRowsInSheet -
                          headerRow,
                      0
                  )
                : 0;


        let validWebsiteRows =
            0;

        let invalidWebsiteRows =
            0;

        let excludedWebsiteRows =
            0;

        let directWebsiteCells =
            0;


        const domainCounts =
            new Map();

        const excludedDomainCounts =
            new Map();


        const processValue = (
            rawValue,
            occurrences = 1
        ) => {
            const result =
                selectBusinessWebsite(
                    rawValue
                );


            if (
                result.status ===
                "empty"
            ) {
                return;
            }


            if (
                result.status ===
                "invalid"
            ) {
                invalidWebsiteRows +=
                    occurrences;

                return;
            }


            if (
                result.status ===
                "excluded"
            ) {
                excludedWebsiteRows +=
                    occurrences;


                if (
                    result.rejectedDomain
                ) {
                    excludedDomainCounts.set(
                        result.rejectedDomain,
                        (
                            excludedDomainCounts.get(
                                result.rejectedDomain
                            ) ||
                            0
                        ) +
                            occurrences
                    );
                }

                return;
            }


            validWebsiteRows +=
                occurrences;


            domainCounts.set(
                result.domain,
                (
                    domainCounts.get(
                        result.domain
                    ) ||
                    0
                ) +
                    occurrences
            );
        };


        const sharedIndexCounts =
            await collectWebsiteReferences({
                filePath,
                websiteColumn,
                headerRow,

                onDirectValue:
                    (
                        value
                    ) => {
                        if (
                            clean(
                                value
                            )
                        ) {
                            directWebsiteCells +=
                                1;
                        }

                        processValue(
                            value,
                            1
                        );
                    },
            });


        const {
            resolvedOccurrences,
        } =
            await processSelectedSharedStrings({
                filePath,
                sharedIndexCounts,

                onValue:
                    (
                        value,
                        occurrences
                    ) => {
                        processValue(
                            value,
                            occurrences
                        );
                    },
            });


        const sharedOccurrences =
            [
                ...sharedIndexCounts.values(),
            ].reduce(
                (
                    sum,
                    count
                ) =>
                    sum +
                    count,
                0
            );


        const unresolvedSharedRows =
            Math.max(
                sharedOccurrences -
                    resolvedOccurrences,
                0
            );


        invalidWebsiteRows +=
            unresolvedSharedRows;


        const uniqueDomains =
            domainCounts.size;


        const duplicateRows =
            Math.max(
                validWebsiteRows -
                    uniqueDomains,
                0
            );


        let existingDomainCount =
            0;

        let existingRows =
            0;


        for (
            const [
                domain,
                count,
            ] of domainCounts
        ) {
            if (
                existingDomains.has(
                    domain
                )
            ) {
                existingDomainCount +=
                    1;

                existingRows +=
                    count;
            }
        }


        /*
         * ВАЖНО:
         * excludedWebsiteRows тоже содержат
         * значение в колонке "Сайт".
         * Поэтому их нельзя одновременно
         * считать как "без сайта".
         */
        const rowsWithWebsiteValue =
            validWebsiteRows +
            invalidWebsiteRows +
            excludedWebsiteRows;


        const withoutWebsite =
            Math.max(
                totalRows -
                    rowsWithWebsiteValue,
                0
            );


        const topDuplicates =
            [
                ...domainCounts.entries(),
            ]
                .filter(
                    (
                        [
                            ,
                            count,
                        ]
                    ) =>
                        count >
                        1
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b[1] -
                        a[1]
                )
                .slice(
                    0,
                    15
                )
                .map(
                    (
                        [
                            domain,
                            count,
                        ]
                    ) => ({
                        domain,
                        count,
                    })
                );


        const topExcludedDomains =
            [
                ...excludedDomainCounts.entries(),
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b[1] -
                        a[1]
                )
                .slice(
                    0,
                    30
                )
                .map(
                    (
                        [
                            domain,
                            count,
                        ]
                    ) => ({
                        domain,
                        count,
                    })
                );


        return {
            totalRows,

            validWebsiteRows,

            withoutWebsite,

            invalidWebsiteRows,

            excludedWebsiteRows,

            uniqueDomains,

            duplicateRows,

            existingDomains:
                existingDomainCount,

            existingRows,

            readyToImport:
                Math.max(
                    uniqueDomains -
                        existingDomainCount,
                    0
                ),

            diagnostics: {
                sharedWebsiteReferences:
                    sharedOccurrences,

                directWebsiteCells,

                unresolvedSharedRows,
            },

            topDuplicates,

            topExcludedDomains,
        };
    };
