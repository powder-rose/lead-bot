import unzipper from "unzipper";
import sax from "sax";

import {
    db,
} from "../db/database.js";

import {
    ensureCompaniesImportSchema,
} from "../db/ensureCompaniesImportSchema.js";

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
    clean(
        value
    ).toLocaleLowerCase(
        "ru-RU"
    );


const splitValues = (
    value = ""
) =>
    String(value)
        .split(/[\n\r;,]+/)
        .map(clean)
        .filter(Boolean);


const uniqueValues = (
    values
) =>
    [
        ...new Set(
            values.filter(
                Boolean
            )
        ),
    ];


const getColumnFromRef = (
    reference = ""
) => {
    const match =
        String(
            reference
        )
            .toUpperCase()
            .match(
                /^([A-Z]+)/
            );


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
    if (
        !selected.size
    ) {
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


const collectMatchedRubricIndexes =
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
                            trim:
                                false,

                            normalize:
                                false,
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


const cellMatches = (
    cell,
    sharedIndexes,
    selectedValues
) => {
    if (
        !cell
    ) {
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


const collectCandidateRows =
    async ({
        filePath,
        headerRow,
        columns,
        categoryIndexes,
        subcategoryIndexes,
        selectedCategories,
        selectedSubcategories,
    }) => {
        const input =
            await openEntry(
                filePath,
                WORKSHEET_PATH
            );


        const columnToField =
            new Map();


        for (
            const [
                field,
                column,
            ] of Object.entries(
                columns
            )
        ) {
            if (
                column
            ) {
                columnToField.set(
                    column,
                    field
                );
            }
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
                            trim:
                                false,

                            normalize:
                                false,
                        }
                    );


                const rows =
                    [];

                const neededSharedIndexes =
                    new Set();


                let currentRowNumber =
                    0;

                let currentRow =
                    null;

                let currentCell =
                    null;

                let readingValue =
                    false;

                let readingInlineText =
                    false;


                const addNeededIndexes =
                    (
                        row
                    ) => {
                        for (
                            const cell of
                            Object.values(
                                row.cells
                            )
                        ) {
                            if (
                                cell?.type !==
                                "s"
                            ) {
                                continue;
                            }


                            const index =
                                Number(
                                    cell.value
                                );


                            if (
                                Number.isInteger(
                                    index
                                )
                            ) {
                                neededSharedIndexes.add(
                                    index
                                );
                            }
                        }
                    };


                const processRow =
                    () => {
                        if (
                            !currentRow ||
                            currentRowNumber <=
                                headerRow
                        ) {
                            return;
                        }


                        const categoryMatch =
                            cellMatches(
                                currentRow.cells
                                    .category,
                                categoryIndexes,
                                selectedCategories
                            );


                        const subcategoryMatch =
                            cellMatches(
                                currentRow.cells
                                    .subcategory,
                                subcategoryIndexes,
                                selectedSubcategories
                            );


                        if (
                            !categoryMatch &&
                            !subcategoryMatch
                        ) {
                            return;
                        }


                        /*
                         * Строки вообще без ячейки сайта
                         * нам для реального импорта не нужны.
                         */
                        if (
                            !currentRow.cells
                                .website
                        ) {
                            return;
                        }


                        rows.push(
                            currentRow
                        );


                        addNeededIndexes(
                            currentRow
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
                            currentRowNumber =
                                Number(
                                    node.attributes
                                        .r
                                ) ||
                                0;


                            currentRow = {
                                rowNumber:
                                    currentRowNumber,

                                cells:
                                    {},
                            };
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


                            const field =
                                columnToField.get(
                                    column
                                );


                            if (
                                currentRowNumber >
                                    headerRow &&
                                field
                            ) {
                                currentCell = {
                                    field,

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
                            currentRow
                        ) {
                            currentRow.cells[
                                currentCell.field
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

                            currentRow =
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
                            rows,
                            neededSharedIndexes,
                        });
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const resolveSharedValues =
    async ({
        filePath,
        neededSharedIndexes,
    }) => {
        if (
            !neededSharedIndexes.size
        ) {
            return new Map();
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
                            trim:
                                false,

                            normalize:
                                false,
                        }
                    );


                const values =
                    new Map();


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
                                neededSharedIndexes.has(
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
                            values.set(
                                sharedIndex,
                                currentValue
                            );

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
                        resolve(
                            values
                        );
                    }
                );


                input.pipe(
                    parser
                );
            }
        );
    };


const getCellValue = (
    cell,
    sharedValues
) => {
    if (
        !cell
    ) {
        return "";
    }


    if (
        cell.type ===
        "s"
    ) {
        const index =
            Number(
                cell.value
            );


        return clean(
            sharedValues.get(
                index
            ) ||
            ""
        );
    }


    if (
        cell.type ===
        "inlineStr"
    ) {
        return clean(
            cell.inlineValue
        );
    }


    return clean(
        cell.value
    );
};


const scoreRecord = (
    record
) => {
    let score =
        0;


    if (
        record.name
    ) {
        score +=
            30;
    }


    if (
        record.phone
    ) {
        score +=
            15;
    }


    if (
        record.email
    ) {
        score +=
            12;
    }


    if (
        record.city
    ) {
        score +=
            8;
    }


    if (
        record.address
    ) {
        score +=
            6;
    }


    if (
        record.externalId
    ) {
        score +=
            4;
    }


    return score;
};


const buildRecord = (
    row,
    sharedValues
) => {
    const get =
        (
            field
        ) =>
            getCellValue(
                row.cells[
                    field
                ],
                sharedValues
            );


    const websiteResult =
        selectBusinessWebsite(
            get(
                "website"
            )
        );


    if (
        websiteResult.status !==
        "valid"
    ) {
        return {
            status:
                websiteResult.status,

            rejectedDomain:
                websiteResult.rejectedDomain,

            record:
                null,
        };
    }


    const phones =
        uniqueValues([
            ...splitValues(
                get(
                    "phone"
                )
            ),

            ...splitValues(
                get(
                    "mobilePhone"
                )
            ),
        ]);


    const emails =
        uniqueValues(
            splitValues(
                get(
                    "email"
                )
            )
        );


    const domain =
        websiteResult.domain;


    const record = {
        externalId:
            get(
                "externalId"
            ) ||
            null,

        name:
            get(
                "name"
            ) ||
            domain,

        website:
            websiteResult.website,

        domain,

        phone:
            phones.join(
                ", "
            ) ||
            null,

        email:
            emails.join(
                ", "
            ) ||
            null,

        city:
            get(
                "city"
            ) ||
            null,

        region:
            get(
                "region"
            ) ||
            null,

        address:
            get(
                "address"
            ) ||
            null,

        category:
            get(
                "category"
            ) ||
            null,

        subcategory:
            get(
                "subcategory"
            ) ||
            null,

        source:
            "2gis",

        sourceRow:
            row.rowNumber,
    };


    return {
        status:
            "valid",

        rejectedDomain:
            "",

        record,
    };
};


const getExistingDomains =
    () =>
        new Set(
            db.prepare(`
                SELECT domain
                FROM companies

                WHERE domain IS NOT NULL
                AND TRIM(domain) <> ''
            `)
                .all()
                .map(
                    (
                        row
                    ) =>
                        String(
                            row.domain
                        )
                            .trim()
                            .toLowerCase()
                            .replace(
                                /^www\./,
                                ""
                            )
                )
                .filter(
                    Boolean
                )
        );


export const import2gisSelection =
    async ({
        filePath,
        headerRow,
        columns,
        categories = [],
        subcategories = [],
    }) => {
        const selectedCategories =
            new Set(
                categories
                    .map(
                        normalizeRubric
                    )
                    .filter(
                        Boolean
                    )
            );


        const selectedSubcategories =
            new Set(
                subcategories
                    .map(
                        normalizeRubric
                    )
                    .filter(
                        Boolean
                    )
            );


        if (
            !selectedCategories.size &&
            !selectedSubcategories.size
        ) {
            throw new Error(
                "Выберите хотя бы одну рубрику или подрубрику"
            );
        }


        ensureCompaniesImportSchema();


        const {
            categoryIndexes,
            subcategoryIndexes,
        } =
            await collectMatchedRubricIndexes({
                filePath,
                selectedCategories,
                selectedSubcategories,
            });


        const {
            rows,
            neededSharedIndexes,
        } =
            await collectCandidateRows({
                filePath,
                headerRow,
                columns,
                categoryIndexes,
                subcategoryIndexes,
                selectedCategories,
                selectedSubcategories,
            });


        const sharedValues =
            await resolveSharedValues({
                filePath,
                neededSharedIndexes,
            });


        const existingDomains =
            getExistingDomains();


        const recordsByDomain =
            new Map();


        let skippedExcluded =
            0;

        let skippedInvalid =
            0;

        let skippedEmptyWebsite =
            0;

        let skippedExisting =
            0;

        let duplicateRows =
            0;


        for (
            const row of
            rows
        ) {
            const result =
                buildRecord(
                    row,
                    sharedValues
                );


            if (
                result.status ===
                "excluded"
            ) {
                skippedExcluded +=
                    1;

                continue;
            }


            if (
                result.status ===
                "invalid"
            ) {
                skippedInvalid +=
                    1;

                continue;
            }


            if (
                result.status ===
                "empty"
            ) {
                skippedEmptyWebsite +=
                    1;

                continue;
            }


            const record =
                result.record;


            if (
                existingDomains.has(
                    record.domain
                )
            ) {
                skippedExisting +=
                    1;

                continue;
            }


            const current =
                recordsByDomain.get(
                    record.domain
                );


            if (
                current
            ) {
                duplicateRows +=
                    1;


                if (
                    scoreRecord(
                        record
                    ) >
                    scoreRecord(
                        current
                    )
                ) {
                    recordsByDomain.set(
                        record.domain,
                        record
                    );
                }

                continue;
            }


            recordsByDomain.set(
                record.domain,
                record
            );
        }


        const records =
            [
                ...recordsByDomain.values(),
            ];


        const insert =
            db.prepare(`
                INSERT INTO companies (
                    name,
                    website,
                    domain,
                    phone,
                    city,
                    region,
                    category,
                    source,
                    scan_status,
                    external_id,
                    email,
                    address,
                    subcategory
                )
                VALUES (
                    @name,
                    @website,
                    @domain,
                    @phone,
                    @city,
                    @region,
                    @category,
                    @source,
                    'new',
                    @externalId,
                    @email,
                    @address,
                    @subcategory
                )
            `);


        const insertAll =
            db.transaction(
                (
                    items
                ) => {
                    let inserted =
                        0;


                    for (
                        const record of
                        items
                    ) {
                        /*
                         * Повторная проверка прямо
                         * перед INSERT защищает от
                         * дублей, если база изменилась
                         * между анализом и импортом.
                         */
                        const exists =
                            db.prepare(`
                                SELECT 1
                                FROM companies
                                WHERE domain = ?
                                LIMIT 1
                            `).get(
                                record.domain
                            );


                        if (
                            exists
                        ) {
                            skippedExisting +=
                                1;

                            continue;
                        }


                        insert.run(
                            record
                        );


                        inserted +=
                            1;
                    }


                    return inserted;
                }
            );


        const imported =
            insertAll(
                records
            );


        const totalCompanies =
            db.prepare(`
                SELECT COUNT(*) AS total
                FROM companies
            `).get().total;


        return {
            imported,

            candidates:
                records.length,

            skippedExisting,

            duplicateRows,

            skippedExcluded,

            skippedInvalid,

            skippedEmptyWebsite,

            totalCompanies,

            selected: {
                categories,

                subcategories,
            },
        };
    };
