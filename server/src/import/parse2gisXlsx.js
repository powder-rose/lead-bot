import unzipper from "unzipper";
import sax from "sax";

import {
    normalize2gisRow,
} from "./normalize2gisRow.js";


const WORKSHEET_PATH =
    "xl/worksheets/sheet1.xml";

const SHARED_STRINGS_PATH =
    "xl/sharedStrings.xml";

const DEFAULT_PREVIEW_LIMIT = 30;
const MAX_ROWS_TO_READ = 100;


const HEADER_ALIASES = {
    externalId: [
        "id",
        "2gis id",
        "2гис id",
    ],

    name: [
        "название",
        "наименование",
        "компания",
    ],

    region: [
        "регион",
    ],

    city: [
        "город",
    ],

    address: [
        "адрес",
    ],

    phone: [
        "телефон",
    ],

    mobilePhone: [
        "мобильный телефон",
        "моб. телефон",
        "мобильный",
    ],

    email: [
        "email",
        "e-mail",
        "электронная почта",
    ],

    website: [
        "сайт",
        "website",
        "web-site",
    ],

    category: [
        "рубрика",
        "категория",
    ],

    subcategory: [
        "подрубрика",
        "подкатегория",
    ],
};


const normalizeHeader = (
    value = ""
) =>
    String(value)
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[.:()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();


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


const getLastRowFromDimension = (
    dimension = ""
) => {
    const lastCell =
        String(dimension)
            .split(":")
            .at(-1) || "";

    const match =
        lastCell.match(/(\d+)$/);

    return match
        ? Number(match[1])
        : null;
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
            (file) =>
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


const readWorksheetPreview = async (
    filePath,
    maxRows = MAX_ROWS_TO_READ
) => {
    const input =
        await openEntry(
            filePath,
            WORKSHEET_PATH
        );

    return new Promise(
        (resolve, reject) => {
            const parser =
                sax.createStream(
                    true,
                    {
                        trim: false,
                        normalize: false,
                    }
                );

            const rows = [];

            let dimension = "";
            let currentRow = null;
            let currentCell = null;
            let readingValue = false;
            let readingInlineText = false;
            let finished = false;


            const finish = () => {
                if (finished) {
                    return;
                }

                finished = true;

                input.unpipe(
                    parser
                );

                input.destroy();

                resolve({
                    rows,
                    dimension,
                });
            };


            parser.on(
                "opentag",
                (node) => {
                    if (
                        node.name ===
                        "dimension"
                    ) {
                        dimension =
                            node.attributes
                                .ref || "";
                    }

                    if (
                        node.name ===
                        "row"
                    ) {
                        currentRow = {
                            index:
                                Number(
                                    node.attributes
                                        .r
                                ) ||
                                rows.length +
                                    1,

                            cells: {},
                        };
                    }

                    if (
                        node.name ===
                        "c"
                    ) {
                        currentCell = {
                            ref:
                                node.attributes
                                    .r || "",

                            type:
                                node.attributes
                                    .t || "",

                            value: "",

                            inlineValue:
                                "",
                        };
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
                (text) => {
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
                (name) => {
                    if (
                        name === "v"
                    ) {
                        readingValue =
                            false;
                    }

                    if (
                        name === "t"
                    ) {
                        readingInlineText =
                            false;
                    }

                    if (
                        name === "c" &&
                        currentCell &&
                        currentRow
                    ) {
                        const column =
                            getColumnFromRef(
                                currentCell.ref
                            );

                        if (column) {
                            currentRow.cells[
                                column
                            ] = {
                                type:
                                    currentCell.type,

                                value:
                                    currentCell.type ===
                                    "inlineStr"
                                        ? currentCell.inlineValue
                                        : currentCell.value,
                            };
                        }

                        currentCell = null;
                    }

                    if (
                        name === "row" &&
                        currentRow
                    ) {
                        rows.push(
                            currentRow
                        );

                        currentRow = null;

                        if (
                            rows.length >=
                            maxRows
                        ) {
                            finish();
                        }
                    }
                }
            );


            parser.on(
                "error",
                (error) => {
                    if (!finished) {
                        reject(
                            error
                        );
                    }
                }
            );


            parser.on(
                "end",
                () => {
                    if (!finished) {
                        finished = true;

                        resolve({
                            rows,
                            dimension,
                        });
                    }
                }
            );


            input.on(
                "error",
                (error) => {
                    if (!finished) {
                        reject(
                            error
                        );
                    }
                }
            );


            input.pipe(
                parser
            );
        }
    );
};


const collectSharedIndexes = (
    rows
) => {
    const indexes =
        new Set();

    for (const row of rows) {
        for (
            const cell of
            Object.values(
                row.cells
            )
        ) {
            if (
                cell.type !== "s"
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
                indexes.add(
                    index
                );
            }
        }
    }

    return indexes;
};


const readSelectedSharedStrings = async (
    filePath,
    indexes
) => {
    if (!indexes.size) {
        return new Map();
    }

    let input;

    try {
        input =
            await openEntry(
                filePath,
                SHARED_STRINGS_PATH
            );
    } catch {
        return new Map();
    }


    return new Promise(
        (resolve, reject) => {
            const parser =
                sax.createStream(
                    true,
                    {
                        trim: false,
                        normalize: false,
                    }
                );

            const result =
                new Map();

            let sharedIndex = -1;
            let capture = false;
            let readingText = false;
            let currentValue = "";
            let finished = false;


            const finish = () => {
                if (finished) {
                    return;
                }

                finished = true;

                input.unpipe(
                    parser
                );

                input.destroy();

                resolve(
                    result
                );
            };


            parser.on(
                "opentag",
                (node) => {
                    if (
                        node.name ===
                        "si"
                    ) {
                        sharedIndex +=
                            1;

                        capture =
                            indexes.has(
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
                (text) => {
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
                (name) => {
                    if (
                        name === "t"
                    ) {
                        readingText =
                            false;
                    }

                    if (
                        name === "si"
                    ) {
                        if (capture) {
                            result.set(
                                sharedIndex,
                                currentValue
                            );
                        }

                        capture =
                            false;

                        if (
                            result.size ===
                            indexes.size
                        ) {
                            finish();
                        }
                    }
                }
            );


            parser.on(
                "error",
                (error) => {
                    if (!finished) {
                        reject(
                            error
                        );
                    }
                }
            );


            parser.on(
                "end",
                () => {
                    if (!finished) {
                        finished = true;

                        resolve(
                            result
                        );
                    }
                }
            );


            input.on(
                "error",
                (error) => {
                    if (!finished) {
                        reject(
                            error
                        );
                    }
                }
            );


            input.pipe(
                parser
            );
        }
    );
};


const resolveRows = (
    rows,
    sharedStrings
) =>
    rows.map(
        (row) => {
            const cells = {};

            for (
                const [
                    column,
                    cell,
                ] of Object.entries(
                    row.cells
                )
            ) {
                cells[column] =
                    cell.type === "s"
                        ? sharedStrings.get(
                              Number(
                                  cell.value
                              )
                          ) || ""
                        : cell.value ||
                          "";
            }

            return {
                index:
                    row.index,

                cells,
            };
        }
    );


const getHeaderMatch = (
    value
) => {
    const normalized =
        normalizeHeader(
            value
        );

    for (
        const [
            field,
            aliases,
        ] of Object.entries(
            HEADER_ALIASES
        )
    ) {
        if (
            aliases.includes(
                normalized
            )
        ) {
            return field;
        }
    }

    return null;
};


const findHeader = (
    rows
) => {
    let best = null;

    for (
        const row of
        rows.slice(0, 15)
    ) {
        const columns = {};
        let score = 0;

        for (
            const [
                column,
                value,
            ] of Object.entries(
                row.cells
            )
        ) {
            const field =
                getHeaderMatch(
                    value
                );

            if (
                !field ||
                columns[field]
            ) {
                continue;
            }

            columns[field] =
                column;

            score += 1;
        }

        if (
            !best ||
            score > best.score
        ) {
            best = {
                rowIndex:
                    row.index,

                score,
                columns,
            };
        }
    }


    if (
        !best ||
        best.score < 4 ||
        !best.columns.name ||
        !best.columns.website
    ) {
        throw new Error(
            "Не удалось распознать строку заголовков 2ГИС"
        );
    }

    return best;
};


export const parse2gisXlsxPreview = async (
    filePath,
    {
        previewLimit =
            DEFAULT_PREVIEW_LIMIT,
    } = {}
) => {
    const worksheet =
        await readWorksheetPreview(
            filePath,
            Math.max(
                MAX_ROWS_TO_READ,
                previewLimit + 20
            )
        );


    const sharedIndexes =
        collectSharedIndexes(
            worksheet.rows
        );


    const sharedStrings =
        await readSelectedSharedStrings(
            filePath,
            sharedIndexes
        );


    const rows =
        resolveRows(
            worksheet.rows,
            sharedStrings
        );


    const header =
        findHeader(
            rows
        );


    const dataRows =
        rows
            .filter(
                (row) =>
                    row.index >
                    header.rowIndex
            )
            .slice(
                0,
                previewLimit
            );


    const preview =
        dataRows.map(
            (row) => ({
                rowNumber:
                    row.index,

                ...normalize2gisRow(
                    row.cells,
                    header.columns
                ),
            })
        );


    const totalRowsInSheet =
        getLastRowFromDimension(
            worksheet.dimension
        );


    const previewWithWebsite =
        preview.filter(
            (company) =>
                Boolean(
                    company.domain
                )
        ).length;


    return {
        format:
            "2gis-xlsx",

        sheet:
            "Sheet 1",

        dimension:
            worksheet.dimension ||
            null,

        headerRow:
            header.rowIndex,

        detectedColumns:
            header.columns,

        totalRowsInSheet,

        estimatedCompanyRows:
            totalRowsInSheet
                ? Math.max(
                      totalRowsInSheet -
                          header.rowIndex,
                      0
                  )
                : null,

        previewStats: {
            rows:
                preview.length,

            withWebsite:
                previewWithWebsite,

            withoutWebsite:
                preview.length -
                previewWithWebsite,
        },

        preview,
    };
};
