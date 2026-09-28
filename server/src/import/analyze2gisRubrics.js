import unzipper from "unzipper";
import sax from "sax";


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


const splitRubrics = (
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


const collectRubricReferences =
    async ({
        filePath,
        categoryColumn,
        subcategoryColumn,
        headerRow,
        directValues,
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


                const sharedReferences =
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


                            let kind =
                                null;


                            if (
                                column ===
                                categoryColumn
                            ) {
                                kind =
                                    "category";
                            }


                            if (
                                column ===
                                subcategoryColumn
                            ) {
                                kind =
                                    "subcategory";
                            }


                            if (
                                currentRow >
                                    headerRow &&
                                kind
                            ) {
                                currentCell = {
                                    kind,

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
                                    const current =
                                        sharedReferences.get(
                                            index
                                        ) || {
                                            category:
                                                0,

                                            subcategory:
                                                0,
                                        };


                                    current[
                                        currentCell.kind
                                    ] +=
                                        1;


                                    sharedReferences.set(
                                        index,
                                        current
                                    );
                                }
                            } else {
                                const value =
                                    currentCell.type ===
                                    "inlineStr"
                                        ? currentCell.inlineValue
                                        : currentCell.value;


                                if (
                                    clean(
                                        value
                                    )
                                ) {
                                    directValues[
                                        currentCell.kind
                                    ].push(
                                        value
                                    );
                                }
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
                            sharedReferences
                        );
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const resolveSharedRubrics =
    async ({
        filePath,
        sharedReferences,
        categoryCounts,
        subcategoryCounts,
    }) => {
        if (
            !sharedReferences.size
        ) {
            return;
        }


        const input =
            await openEntry(
                filePath,
                SHARED_STRINGS_PATH
            );


        await new Promise(
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
                                sharedReferences.has(
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
                            const counts =
                                sharedReferences.get(
                                    sharedIndex
                                );


                            const parts =
                                splitRubrics(
                                    currentValue
                                );


                            for (
                                const part of
                                parts
                            ) {
                                if (
                                    counts.category
                                ) {
                                    categoryCounts.set(
                                        part,
                                        (
                                            categoryCounts.get(
                                                part
                                            ) ||
                                            0
                                        ) +
                                            counts.category
                                    );
                                }


                                if (
                                    counts.subcategory
                                ) {
                                    subcategoryCounts.set(
                                        part,
                                        (
                                            subcategoryCounts.get(
                                                part
                                            ) ||
                                            0
                                        ) +
                                            counts.subcategory
                                    );
                                }
                            }


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
                    resolve
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const addDirectValues =
    (
        values,
        target
    ) => {
        for (
            const value of
            values
        ) {
            const uniqueParts =
                new Set(
                    splitRubrics(
                        value
                    )
                );


            for (
                const part of
                uniqueParts
            ) {
                target.set(
                    part,
                    (
                        target.get(
                            part
                        ) ||
                        0
                    ) +
                        1
                );
            }
        }
    };


const toSortedList =
    (
        counts
    ) =>
        [
            ...counts.entries(),
        ]
            .sort(
                (
                    a,
                    b
                ) => {
                    if (
                        b[1] !==
                        a[1]
                    ) {
                        return (
                            b[1] -
                            a[1]
                        );
                    }


                    return a[0]
                        .localeCompare(
                            b[0],
                            "ru"
                        );
                }
            )
            .map(
                (
                    [
                        name,
                        count,
                    ]
                ) => ({
                    name,
                    count,
                })
            );


export const analyze2gisRubrics =
    async ({
        filePath,
        categoryColumn,
        subcategoryColumn,
        headerRow,
    }) => {
        if (
            !categoryColumn &&
            !subcategoryColumn
        ) {
            throw new Error(
                "В XLSX не найдены колонки рубрик"
            );
        }


        const categoryCounts =
            new Map();

        const subcategoryCounts =
            new Map();


        const directValues = {
            category:
                [],

            subcategory:
                [],
        };


        const sharedReferences =
            await collectRubricReferences({
                filePath,
                categoryColumn,
                subcategoryColumn,
                headerRow,
                directValues,
            });


        await resolveSharedRubrics({
            filePath,
            sharedReferences,
            categoryCounts,
            subcategoryCounts,
        });


        addDirectValues(
            directValues.category,
            categoryCounts
        );

        addDirectValues(
            directValues.subcategory,
            subcategoryCounts
        );


        const categories =
            toSortedList(
                categoryCounts
            );

        const subcategories =
            toSortedList(
                subcategoryCounts
            );


        return {
            categories,

            subcategories,

            totals: {
                categories:
                    categories.length,

                subcategories:
                    subcategories.length,
            },
        };
    };
