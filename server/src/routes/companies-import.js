import {
    Router,
} from "express";

import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import {
    randomUUID,
} from "node:crypto";

import {
    fileURLToPath,
} from "node:url";

import {
    db,
} from "../db/database.js";

import {
    normalizeDomain,
} from "../utils/domain.js";

import {
    parse2gisXlsxPreview,
} from "../import/parse2gisXlsx.js";

import {
    analyze2gisXlsx,
} from "../import/analyze2gisXlsx.js";

import {
    analyze2gisRubrics,
} from "../import/analyze2gisRubrics.js";

import {
    analyze2gisSelection,
} from "../import/analyze2gisSelection.js";

import {
    import2gisSelection,
} from "../import/import2gisSelection.js";


const router =
    Router();


const __filename =
    fileURLToPath(
        import.meta.url
    );

const __dirname =
    path.dirname(
        __filename
    );


const importsDirectory =
    path.resolve(
        __dirname,
        "../../data/imports"
    );


fs.mkdirSync(
    importsDirectory,
    {
        recursive: true,
    }
);


const storage =
    multer.diskStorage({
        destination: (
            req,
            file,
            callback
        ) => {
            callback(
                null,
                importsDirectory
            );
        },

        filename: (
            req,
            file,
            callback
        ) => {
            callback(
                null,
                `${Date.now()}-${randomUUID()}.xlsx`
            );
        },
    });


const upload =
    multer({
        storage,

        limits: {
            fileSize:
                200 *
                1024 *
                1024,
        },

        fileFilter: (
            req,
            file,
            callback
        ) => {
            const extension =
                path.extname(
                    file.originalname
                )
                    .toLowerCase();

            if (
                extension !==
                ".xlsx"
            ) {
                return callback(
                    new Error(
                        "Поддерживаются только XLSX-файлы"
                    )
                );
            }

            callback(
                null,
                true
            );
        },
    });


const getImportFilePath = (
    importId
) => {
    const raw =
        String(
            importId ||
            ""
        );

    const safeName =
        path.basename(
            raw
        );


    if (
        !safeName ||
        safeName !== raw ||
        path.extname(
            safeName
        ).toLowerCase() !==
            ".xlsx"
    ) {
        throw new Error(
            "Некорректный importId"
        );
    }


    const filePath =
        path.join(
            importsDirectory,
            safeName
        );


    if (
        !fs.existsSync(
            filePath
        )
    ) {
        throw new Error(
            "Файл импорта не найден. Загрузите XLSX заново."
        );
    }


    return filePath;
};


const readStructure =
    async (
        filePath
    ) =>
        parse2gisXlsxPreview(
            filePath,
            {
                previewLimit:
                    1,
            }
        );


const getExistingDomains =
    () => {
        const rows =
            db.prepare(`
                SELECT domain
                FROM companies

                WHERE domain IS NOT NULL
                AND TRIM(domain) <> ''
            `).all();


        return new Set(
            rows
                .map(
                    (
                        row
                    ) =>
                        normalizeDomain(
                            row.domain
                        )
                )
                .filter(
                    Boolean
                )
        );
    };


router.post(
    "/preview",
    upload.single(
        "file"
    ),
    async (
        req,
        res
    ) => {
        if (!req.file) {
            return res
                .status(400)
                .json({
                    error:
                        "Файл не передан",

                    data:
                        null,
                });
        }


        try {
            const preview =
                await parse2gisXlsxPreview(
                    req.file.path,
                    {
                        previewLimit:
                            30,
                    }
                );


            return res.json({
                error:
                    null,

                data: {
                    importId:
                        req.file.filename,

                    originalName:
                        req.file.originalname,

                    fileSize:
                        req.file.size,

                    ...preview,
                },
            });
        } catch (
            error
        ) {
            fs.unlink(
                req.file.path,
                () => {}
            );


            console.error(
                "2GIS PREVIEW ERROR:",
                error.message
            );


            return res
                .status(400)
                .json({
                    error:
                        error.message ||
                        "Не удалось прочитать XLSX-файл",

                    data:
                        null,
                });
        }
    }
);


router.post(
    "/analyze",
    async (
        req,
        res
    ) => {
        try {
            const filePath =
                getImportFilePath(
                    req.body.importId
                );


            const structure =
                await readStructure(
                    filePath
                );


            const analysis =
                await analyze2gisXlsx({
                    filePath,

                    websiteColumn:
                        structure
                            .detectedColumns
                            .website,

                    headerRow:
                        structure.headerRow,

                    totalRowsInSheet:
                        structure
                            .totalRowsInSheet,

                    existingDomains:
                        getExistingDomains(),
                });


            return res.json({
                error:
                    null,

                data: {
                    importId:
                        req.body.importId,

                    ...analysis,
                },
            });
        } catch (
            error
        ) {
            console.error(
                "2GIS ANALYZE ERROR:",
                error.message
            );


            return res
                .status(400)
                .json({
                    error:
                        error.message ||
                        "Не удалось проанализировать XLSX-файл",

                    data:
                        null,
                });
        }
    }
);


router.post(
    "/rubrics",
    async (
        req,
        res
    ) => {
        try {
            const filePath =
                getImportFilePath(
                    req.body.importId
                );


            const structure =
                await readStructure(
                    filePath
                );


            const rubrics =
                await analyze2gisRubrics({
                    filePath,

                    categoryColumn:
                        structure
                            .detectedColumns
                            .category,

                    subcategoryColumn:
                        structure
                            .detectedColumns
                            .subcategory,

                    headerRow:
                        structure.headerRow,
                });


            return res.json({
                error:
                    null,

                data: {
                    importId:
                        req.body.importId,

                    ...rubrics,
                },
            });
        } catch (
            error
        ) {
            console.error(
                "2GIS RUBRICS ERROR:",
                error.message
            );


            return res
                .status(400)
                .json({
                    error:
                        error.message ||
                        "Не удалось получить рубрики XLSX-файла",

                    data:
                        null,
                });
        }
    }
);



router.post(
    "/selection-preview",
    async (
        req,
        res
    ) => {
        try {
            const categories =
                Array.isArray(
                    req.body.categories
                )
                    ? req.body.categories
                    : [];

            const subcategories =
                Array.isArray(
                    req.body.subcategories
                )
                    ? req.body.subcategories
                    : [];


            if (
                !categories.length &&
                !subcategories.length
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Выберите хотя бы одну рубрику или подрубрику",

                        data:
                            null,
                    });
            }


            const filePath =
                getImportFilePath(
                    req.body.importId
                );


            const structure =
                await readStructure(
                    filePath
                );


            const analysis =
                await analyze2gisSelection({
                    filePath,

                    headerRow:
                        structure.headerRow,

                    websiteColumn:
                        structure
                            .detectedColumns
                            .website,

                    categoryColumn:
                        structure
                            .detectedColumns
                            .category,

                    subcategoryColumn:
                        structure
                            .detectedColumns
                            .subcategory,

                    categories,

                    subcategories,

                    existingDomains:
                        getExistingDomains(),
                });


            return res.json({
                error:
                    null,

                data: {
                    importId:
                        req.body.importId,

                    ...analysis,
                },
            });
        } catch (
            error
        ) {
            console.error(
                "2GIS SELECTION PREVIEW ERROR:",
                error.message
            );


            return res
                .status(400)
                .json({
                    error:
                        error.message ||
                        "Не удалось рассчитать выбранные рубрики",

                    data:
                        null,
                });
        }
    }
);


router.post(
    "/commit",
    async (
        req,
        res
    ) => {
        try {
            const categories =
                Array.isArray(
                    req.body.categories
                )
                    ? req.body.categories
                    : [];


            const subcategories =
                Array.isArray(
                    req.body.subcategories
                )
                    ? req.body.subcategories
                    : [];


            if (
                !categories.length &&
                !subcategories.length
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Выберите хотя бы одну рубрику или подрубрику",

                        data:
                            null,
                    });
            }


            const filePath =
                getImportFilePath(
                    req.body.importId
                );


            const structure =
                await readStructure(
                    filePath
                );


            const result =
                await import2gisSelection({
                    filePath,

                    headerRow:
                        structure.headerRow,

                    columns:
                        structure
                            .detectedColumns,

                    categories,

                    subcategories,
                });


            /*
             * После успешной записи исходный
             * временный XLSX больше не нужен.
             */
            fs.unlink(
                filePath,
                () => {}
            );


            return res.json({
                error:
                    null,

                data:
                    result,
            });
        } catch (
            error
        ) {
            console.error(
                "2GIS IMPORT ERROR:",
                error.message
            );


            return res
                .status(400)
                .json({
                    error:
                        error.message ||
                        "Не удалось импортировать компании",

                    data:
                        null,
                });
        }
    }
);


router.post(
    "/discard",
    (
        req,
        res
    ) => {
        try {
            const filePath =
                getImportFilePath(
                    req.body.importId
                );


            fs.unlinkSync(
                filePath
            );


            return res.json({
                error:
                    null,

                data: {
                    deleted:
                        true,
                },
            });
        } catch (
            error
        ) {
            /*
             * Если файл уже удалён после commit,
             * discard считаем успешным.
             */
            if (
                String(
                    error.message
                ).includes(
                    "Файл импорта не найден"
                )
            ) {
                return res.json({
                    error:
                        null,

                    data: {
                        deleted:
                            true,
                    },
                });
            }


            return res
                .status(400)
                .json({
                    error:
                        error.message,

                    data:
                        null,
                });
        }
    }
);


router.use(
    (
        error,
        req,
        res,
        next
    ) => {
        if (
            error instanceof
            multer.MulterError
        ) {
            return res
                .status(400)
                .json({
                    error:
                        error.code ===
                        "LIMIT_FILE_SIZE"
                            ? "Файл слишком большой. Максимум 200 МБ"
                            : error.message,

                    data:
                        null,
                });
        }


        if (error) {
            return res
                .status(400)
                .json({
                    error:
                        error.message,

                    data:
                        null,
                });
        }


        next();
    }
);


export default router;
