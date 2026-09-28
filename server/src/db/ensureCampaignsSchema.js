import { db } from "../db/database.js";

const CAMPAIGN_STATUSES = [
    "draft",
    "ready",
    "running",
    "paused",
    "completed",
];

const COMPANY_PROCESSING_STATUSES = [
    "pending",
    "scanning",
    "form_found",
    "no_form",
    "no_site",
    "error",
    "test_filled",
    "sent",
    "skipped",
];

const addColumnIfMissing = (tableName, columnName, definition) => {
    const columns = new Set(
        db.prepare(`PRAGMA table_info(${tableName})`)
            .all()
            .map((column) => column.name)
    );

    if (!columns.has(columnName)) {
        db.exec(`
            ALTER TABLE ${tableName}
            ADD COLUMN ${columnName} ${definition}
        `);
    }
};

export const ensureCampaignsSchema = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sender_name TEXT,
            sender_phone TEXT,
            sender_email TEXT,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN (${CAMPAIGN_STATUSES.map((status) => `'${status}'`).join(", ")})),
            selection_json TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS campaign_companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER NOT NULL,
            company_id INTEGER,
            company_name TEXT NOT NULL,
            website TEXT,
            domain TEXT,
            city TEXT,
            region TEXT,
            category TEXT,
            processing_status TEXT NOT NULL DEFAULT 'pending'
                CHECK (processing_status IN (${COMPANY_PROCESSING_STATUSES.map((status) => `'${status}'`).join(", ")})),
            scan_error TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(campaign_id, company_id)
        );
    `);

    /*
     * Эти колонки добавляются безопасно и в уже существующую базу,
     * созданную предыдущим модулем кампаний.
     */
    addColumnIfMissing("campaigns", "scan_started_at", "TEXT");
    addColumnIfMissing("campaigns", "scan_finished_at", "TEXT");

    addColumnIfMissing("campaign_companies", "scan_page_url", "TEXT");
    addColumnIfMissing("campaign_companies", "scan_forms_count", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("campaign_companies", "best_form_score", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("campaign_companies", "scan_forms_json", "TEXT");
    addColumnIfMissing("campaign_companies", "has_captcha", "INTEGER NOT NULL DEFAULT 0");
    addColumnIfMissing("campaign_companies", "scanned_at", "TEXT");

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_campaigns_status
            ON campaigns(status);

        CREATE INDEX IF NOT EXISTS idx_campaign_companies_campaign_id
            ON campaign_companies(campaign_id);

        CREATE INDEX IF NOT EXISTS idx_campaign_companies_company_id
            ON campaign_companies(company_id);

        CREATE INDEX IF NOT EXISTS idx_campaign_companies_processing_status
            ON campaign_companies(processing_status);
    `);
};
