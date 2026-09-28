import {
    db,
} from "../db/database.js";


const IMPORT_COLUMNS = [
    {
        name:
            "external_id",

        sql:
            "TEXT",
    },

    {
        name:
            "email",

        sql:
            "TEXT",
    },

    {
        name:
            "address",

        sql:
            "TEXT",
    },

    {
        name:
            "subcategory",

        sql:
            "TEXT",
    },
];


export const ensureCompaniesImportSchema =
    () => {
        const columns =
            new Set(
                db.prepare(`
                    PRAGMA table_info(companies)
                `)
                    .all()
                    .map(
                        (
                            column
                        ) =>
                            column.name
                    )
            );


        for (
            const column of
            IMPORT_COLUMNS
        ) {
            if (
                columns.has(
                    column.name
                )
            ) {
                continue;
            }


            db.exec(`
                ALTER TABLE companies
                ADD COLUMN ${column.name} ${column.sql}
            `);
        }


        db.exec(`
            CREATE INDEX IF NOT EXISTS
                idx_companies_external_id
            ON companies(external_id);
        `);
    };
