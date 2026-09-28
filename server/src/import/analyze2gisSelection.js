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


const normalizeRubric = (
    value = ""
) =>
    clean(value)
        .toLocaleLowerCase(
            "ru-RU"
        );


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


const hasSelectedRubric = (
    value,
    selected
) => {
    if (!selected.size) {
        return false;
    }

    return splitValues(
        value
    ).some(
        (
            item
        ) =>
            selected.has(
                normalizeRubric(
                    item
                )
            )
    );
};


const collectMatchedSharedIndexes =
    async ({
        filePath,
        selectedCategories,
        selectedSubcategories,
    }) => {
        const input =
            await openEntry(
                filePath,
                SHARED_STRINGS_PATH
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

                const categoryIndexes =
                    new Set();

                const subcategoryIndexes =
                    new Set();

                let sharedIndex =
                    -1;

                let readingText =
                    false;

                let currentValue =
                    "";


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

                            currentValue =
                                "";
                        }

                        if (
                            node.name ===
                            "t"
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
                            "si"
                        ) {
                            if (
                                hasSelectedRubric(
                                    currentValue,
                                    selectedCategories
                                )
                            ) {
                                categoryIndexes.add(
                                    sharedIndex
                                );
                            }

                            if (
                                hasSelectedRubric(
                                    currentValue,
                                    selectedSubcategories
                                )
                            ) {
                                subcategoryIndexes.add(
                                    sharedIndex
                                );
                            }
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
                            categoryIndexes,
                            subcategoryIndexes,
                        });
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const scanSelectedRows =
    async ({
        filePath,
        headerRow,
        websiteColumn,
        categoryColumn,
        subcategoryColumn,
        categoryIndexes,
        subcategoryIndexes,
        selectedCategories,
        selectedSubcategories,
        onDirectWebsite,
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

                const websiteSharedCounts =
                    new Map();

                let matchedRows =
                    0;

                let currentRow =
                    0;

                let rowData =
                    null;

                let currentCell =
                    null;

                let readingValue =
                    false;

                let readingInlineText =
                    false;


                const createEmptyRow =
                    () => ({
                        category: null,
                        subcategory: null,
                        website: null,
                    });


                const cellMatches = (
                    cell,
                    sharedIndexes,
                    selectedValues
                ) => {
                    if (!cell) {
                        return false;
                    }

                    if (
                        cell.type ===
                        "s"
                    ) {
                        const index =
                            Number(
                                cell.value
                            );

                        return (
                            Number.isInteger(
                                index
                            ) &&
                            sharedIndexes.has(
                                index
                            )
                        );
                    }

                    const value =
                        cell.type ===
                        "inlineStr"
                            ? cell.inlineValue
                            : cell.value;

                    return hasSelectedRubric(
                        value,
                        selectedValues
                    );
                };


                const processRow =
                    () => {
                        if (
                            !rowData ||
                            currentRow <=
                                headerRow
                        ) {
                            return;
                        }


                        const categoryMatch =
                            cellMatches(
                                rowData.category,
                                categoryIndexes,
                                selectedCategories
                            );

                        const subcategoryMatch =
                            cellMatches(
                                rowData.subcategory,
                                subcategoryIndexes,
                                selectedSubcategories
                            );


                        if (
                            !categoryMatch &&
                            !subcategoryMatch
                        ) {
                            return;
                        }


                        matchedRows +=
                            1;


                        const website =
                            rowData.website;


                        if (!website) {
                            return;
                        }


                        if (
                            website.type ===
                            "s"
                        ) {
                            const index =
                                Number(
                                    website.value
                                );

                            if (
                                Number.isInteger(
                                    index
                                )
                            ) {
                                websiteSharedCounts.set(
                                    index,
                                    (
                                        websiteSharedCounts.get(
                                            index
                                        ) ||
                                        0
                                    ) +
                                        1
                                );
                            }

                            return;
                        }


                        const value =
                            website.type ===
                            "inlineStr"
                                ? website.inlineValue
                                : website.value;

                        onDirectWebsite(
                            value,
                            1
                        );
                    };


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

                            rowData =
                                createEmptyRow();
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

                            let key =
                                null;


                            if (
                                column ===
                                categoryColumn
                            ) {
                                key =
                                    "category";
                            }

                            if (
                                column ===
                                subcategoryColumn
                            ) {
                                key =
                                    "subcategory";
                            }

                            if (
                                column ===
                                websiteColumn
                            ) {
                                key =
                                    "website";
                            }


                            if (
                                currentRow >
                                    headerRow &&
                                key
                            ) {
                                currentCell = {
                                    key,

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
                            currentCell &&
                            rowData
                        ) {
                            rowData[
                                currentCell.key
                            ] =
                                currentCell;

                            currentCell =
                                null;
                        }

                        if (
                            name ===
                            "row"
                        ) {
                            processRow();

                            rowData =
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
                        resolve({
                            matchedRows,
                            websiteSharedCounts,
                        });
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const resolveSelectedWebsites =
    async ({
        filePath,
        websiteSharedCounts,
        onWebsite,
    }) => {
        if (
            !websiteSharedCounts.size
        ) {
            return {
                resolvedOccurrences:
                    0,
            };
        }


        const input =
            await openEntry(
                filePath,
                SHARED_STRINGS_PATH
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
                                websiteSharedCounts.has(
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
                                websiteSharedCounts.get(
                                    sharedIndex
                                ) ||
                                0;

                            onWebsite(
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


export const analyze2gisSelection =
    async ({
        filePath,
        headerRow,
        websiteColumn,
        categoryColumn,
        subcategoryColumn,
        categories = [],
        subcategories = [],
        existingDomains =
            new Set(),
    }) => {
        const selectedCategories =
            new Set(
                categories
                    .map(
                        normalizeRubric
                    )
                    .filter(Boolean)
            );

        const selectedSubcategories =
            new Set(
                subcategories
                    .map(
                        normalizeRubric
                    )
                    .filter(Boolean)
            );


        if (
            !selectedCategories.size &&
            !selectedSubcategories.size
        ) {
            throw new Error(
                "Выберите хотя бы одну рубрику или подрубрику"
            );
        }


        const {
            categoryIndexes,
            subcategoryIndexes,
        } =
            await collectMatchedSharedIndexes({
                filePath,
                selectedCategories,
                selectedSubcategories,
            });


        let validWebsiteRows =
            0;

        let invalidWebsiteRows =
            0;

        let excludedWebsiteRows =
            0;


        const domainCounts =
            new Map();

        const excludedDomainCounts =
            new Map();


        const processWebsite = (
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


        const {
            matchedRows,
            websiteSharedCounts,
        } =
            await scanSelectedRows({
                filePath,
                headerRow,
                websiteColumn,
                categoryColumn,
                subcategoryColumn,
                categoryIndexes,
                subcategoryIndexes,
                selectedCategories,
                selectedSubcategories,
                onDirectWebsite:
                    processWebsite,
            });


        const sharedOccurrences =
            [
                ...websiteSharedCounts.values(),
            ].reduce(
                (
                    sum,
                    count
                ) =>
                    sum +
                    count,
                0
            );


        const {
            resolvedOccurrences,
        } =
            await resolveSelectedWebsites({
                filePath,
                websiteSharedCounts,
                onWebsite:
                    processWebsite,
            });


        const unresolvedWebsiteRows =
            Math.max(
                sharedOccurrences -
                    resolvedOccurrences,
                0
            );


        invalidWebsiteRows +=
            unresolvedWebsiteRows;


        const rowsWithWebsiteValue =
            validWebsiteRows +
            invalidWebsiteRows +
            excludedWebsiteRows;


        const withoutWebsite =
            Math.max(
                matchedRows -
                    rowsWithWebsiteValue,
                0
            );


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


        return {
            filterMode:
                "any_selected_rubric",

            selected: {
                categories,
                subcategories,
            },

            matchedRows,

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

            topDuplicates,

            topExcludedDomains,
        };
    };
