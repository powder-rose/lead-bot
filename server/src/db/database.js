import Database from "better-sqlite3";

import fs from "node:fs";
import path from "node:path";
import {
    fileURLToPath,
} from "node:url";


const __filename =
    fileURLToPath(
        import.meta.url
    );

const __dirname =
    path.dirname(
        __filename
    );


const dataDirectory =
    path.resolve(
        __dirname,
        "../../data"
    );


if (
    !fs.existsSync(
        dataDirectory
    )
) {
    fs.mkdirSync(
        dataDirectory,
        {
            recursive: true,
        }
    );
}


const databasePath =
    path.join(
        dataDirectory,
        "leadbot.db"
    );


export const db =
    new Database(
        databasePath
    );


db.pragma(
    "journal_mode = WAL"
);

db.pragma(
    "foreign_keys = ON"
);


db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        website TEXT,
        domain TEXT,

        phone TEXT,

        city TEXT,
        region TEXT,

        category TEXT,

        source TEXT DEFAULT 'manual',

        scan_status TEXT NOT NULL DEFAULT 'new'
            CHECK (
                scan_status IN (
                    'new',
                    'scanned',
                    'no_form',
                    'error'
                )
            ),

        last_scanned_at TEXT,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );


    CREATE INDEX IF NOT EXISTS
        idx_companies_domain
    ON companies(domain);


    CREATE INDEX IF NOT EXISTS
        idx_companies_scan_status
    ON companies(scan_status);


    CREATE INDEX IF NOT EXISTS
        idx_companies_category
    ON companies(category);


    CREATE INDEX IF NOT EXISTS
        idx_companies_city
    ON companies(city);
`);


console.log(
    `SQLite ready: ${databasePath}`
);