import { db } from "../db/database.js";
import { ensureCampaignsSchema } from "../db/ensureCampaignsSchema.js";

ensureCampaignsSchema();

const CAMPAIGN_STATUSES = new Set([
    "draft",
    "ready",
    "running",
    "paused",
    "completed",
]);

const MAX_CAMPAIGN_COMPANIES = 50000;

const safeJsonParse = (value, fallback = null) => {
    if (!value) return fallback;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const mapCampaign = (row) => {
    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        senderName: row.sender_name,
        senderPhone: row.sender_phone,
        senderEmail: row.sender_email,
        message: row.message,
        status: row.status,
        selection: safeJsonParse(row.selection_json, null),
        companyCount: Number(row.company_count || 0),
        pendingCount: Number(row.pending_count || 0),
        scanningCount: Number(row.scanning_count || 0),
        formFoundCount: Number(row.form_found_count || 0),
        noFormCount: Number(row.no_form_count || 0),
        noSiteCount: Number(row.no_site_count || 0),
        errorCount: Number(row.error_count || 0),
        captchaCount: Number(row.captcha_count || 0),
        testFilledCount: Number(row.test_filled_count || 0),
        sentCount: Number(row.sent_count || 0),
        scanStartedAt: row.scan_started_at,
        scanFinishedAt: row.scan_finished_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

const campaignSelectSql = `
    SELECT
        c.*,
        COUNT(cc.id) AS company_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'scanning' THEN 1 ELSE 0 END), 0) AS scanning_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'form_found' THEN 1 ELSE 0 END), 0) AS form_found_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'no_form' THEN 1 ELSE 0 END), 0) AS no_form_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'no_site' THEN 1 ELSE 0 END), 0) AS no_site_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'error' THEN 1 ELSE 0 END), 0) AS error_count,
        COALESCE(SUM(CASE WHEN cc.has_captcha = 1 THEN 1 ELSE 0 END), 0) AS captcha_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'test_filled' THEN 1 ELSE 0 END), 0) AS test_filled_count,
        COALESCE(SUM(CASE WHEN cc.processing_status = 'sent' THEN 1 ELSE 0 END), 0) AS sent_count
    FROM campaigns c
    LEFT JOIN campaign_companies cc
        ON cc.campaign_id = c.id
`;

const buildFilteredCompaniesQuery = (filters = {}) => {
    const where = [];
    const params = {};

    const search = String(filters.search || "").trim();
    const scanStatus = String(filters.scanStatus || "").trim();
    const category = String(filters.category || "").trim();
    const city = String(filters.city || "").trim();
    const region = String(filters.region || "").trim();

    if (search) {
        where.push(`
            (
                name LIKE @search
                OR website LIKE @search
                OR domain LIKE @search
                OR phone LIKE @search
                OR city LIKE @search
                OR region LIKE @search
                OR category LIKE @search
            )
        `);
        params.search = `%${search}%`;
    }

    if (scanStatus) {
        where.push("scan_status = @scanStatus");
        params.scanStatus = scanStatus;
    }

    if (category) {
        where.push("category LIKE @category");
        params.category = `%${category}%`;
    }

    if (city) {
        where.push("city = @city");
        params.city = city;
    }

    if (region) {
        where.push("region = @region");
        params.region = region;
    }

    return {
        whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
        params,
    };
};

const getCompaniesByIds = (ids) => {
    const uniqueIds = [...new Set(
        ids
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
    )];

    if (!uniqueIds.length) return [];

    const rows = [];
    const CHUNK = 500;

    for (let offset = 0; offset < uniqueIds.length; offset += CHUNK) {
        const chunk = uniqueIds.slice(offset, offset + CHUNK);
        const placeholders = chunk.map(() => "?").join(", ");

        rows.push(...db.prepare(`
            SELECT id, name, website, domain, city, region, category
            FROM companies
            WHERE id IN (${placeholders})
            ORDER BY id ASC
        `).all(...chunk));
    }

    return rows;
};

const resolveSelection = (selection = {}) => {
    if (selection.mode === "filters") {
        const { whereSql, params } = buildFilteredCompaniesQuery(
            selection.filters || {}
        );

        const excluded = new Set(
            (selection.excludedIds || [])
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id) && id > 0)
        );

        return db.prepare(`
            SELECT id, name, website, domain, city, region, category
            FROM companies
            ${whereSql}
            ORDER BY id ASC
        `).all(params).filter((company) => !excluded.has(company.id));
    }

    return getCompaniesByIds(selection.companyIds || []);
};

export const getCampaigns = () => {
    const rows = db.prepare(`
        ${campaignSelectSql}
        GROUP BY c.id
        ORDER BY c.id DESC
    `).all();

    return rows.map(mapCampaign);
};

export const getCampaignById = (id) => {
    const row = db.prepare(`
        ${campaignSelectSql}
        WHERE c.id = ?
        GROUP BY c.id
    `).get(id);

    return mapCampaign(row);
};

export const getCampaignCompanies = (
    campaignId,
    { page = 1, limit = 25, processingStatus = "" } = {}
) => {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const status = String(processingStatus || "").trim();
    const statusSql = status ? "AND processing_status = @status" : "";

    const total = Number(db.prepare(`
        SELECT COUNT(*) AS total
        FROM campaign_companies
        WHERE campaign_id = @campaignId
        ${statusSql}
    `).get({
        campaignId,
        ...(status ? { status } : {}),
    })?.total || 0);

    const companies = db.prepare(`
        SELECT
            id,
            campaign_id,
            company_id,
            company_name,
            website,
            domain,
            city,
            region,
            category,
            processing_status,
            scan_error,
            scan_page_url,
            scan_forms_count,
            best_form_score,
            has_captcha,
            scanned_at,
            created_at,
            updated_at
        FROM campaign_companies
        WHERE campaign_id = @campaignId
        ${statusSql}
        ORDER BY id ASC
        LIMIT @limit
        OFFSET @offset
    `).all({
        campaignId,
        ...(status ? { status } : {}),
        limit: safeLimit,
        offset,
    }).map((row) => ({
        id: row.id,
        campaignId: row.campaign_id,
        companyId: row.company_id,
        companyName: row.company_name,
        website: row.website,
        domain: row.domain,
        city: row.city,
        region: row.region,
        category: row.category,
        processingStatus: row.processing_status,
        scanError: row.scan_error,
        scanPageUrl: row.scan_page_url,
        scanFormsCount: Number(row.scan_forms_count || 0),
        bestFormScore: Number(row.best_form_score || 0),
        hasCaptcha: Boolean(row.has_captcha),
        scannedAt: row.scanned_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));

    return {
        companies,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            lastPage: Math.max(Math.ceil(total / safeLimit), 1),
        },
    };
};

export const getCampaignCompanyScanResult = (
    campaignId,
    campaignCompanyId
) => {
    const row = db.prepare(`
        SELECT
            id,
            campaign_id,
            company_id,
            company_name,
            website,
            domain,
            processing_status,
            scan_error,
            scan_page_url,
            scan_forms_count,
            best_form_score,
            scan_forms_json,
            has_captcha,
            scanned_at
        FROM campaign_companies
        WHERE campaign_id = ?
        AND id = ?
    `).get(campaignId, campaignCompanyId);

    if (!row) return null;

    return {
        id: row.id,
        campaignId: row.campaign_id,
        companyId: row.company_id,
        companyName: row.company_name,
        website: row.website,
        domain: row.domain,
        processingStatus: row.processing_status,
        scanError: row.scan_error,
        scanPageUrl: row.scan_page_url,
        scanFormsCount: Number(row.scan_forms_count || 0),
        bestFormScore: Number(row.best_form_score || 0),
        forms: safeJsonParse(row.scan_forms_json, []),
        hasCaptcha: Boolean(row.has_captcha),
        scannedAt: row.scanned_at,
    };
};

export const createCampaign = ({
    name,
    senderName = "",
    senderPhone = "",
    senderEmail = "",
    message,
    selection,
}) => {
    const cleanName = String(name || "").trim();
    const cleanMessage = String(message || "").trim();

    if (!cleanName) {
        throw new Error("Название кампании обязательно");
    }

    if (!cleanMessage) {
        throw new Error("Текст обращения обязателен");
    }

    if (cleanName.length > 200) {
        throw new Error("Название кампании слишком длинное");
    }

    if (cleanMessage.length > 5000) {
        throw new Error("Текст обращения не должен превышать 5000 символов");
    }

    const companies = resolveSelection(selection || {});

    if (!companies.length) {
        throw new Error("Не выбрано ни одной компании");
    }

    if (companies.length > MAX_CAMPAIGN_COMPANIES) {
        throw new Error(
            `В одной кампании можно выбрать не более ${MAX_CAMPAIGN_COMPANIES.toLocaleString("ru-RU")} компаний`
        );
    }

    const create = db.transaction(() => {
        const campaignResult = db.prepare(`
            INSERT INTO campaigns (
                name,
                sender_name,
                sender_phone,
                sender_email,
                message,
                status,
                selection_json
            )
            VALUES (
                @name,
                @senderName,
                @senderPhone,
                @senderEmail,
                @message,
                'draft',
                @selectionJson
            )
        `).run({
            name: cleanName,
            senderName: String(senderName || "").trim() || null,
            senderPhone: String(senderPhone || "").trim() || null,
            senderEmail: String(senderEmail || "").trim() || null,
            message: cleanMessage,
            selectionJson: JSON.stringify(selection || {}),
        });

        const campaignId = Number(campaignResult.lastInsertRowid);

        const insertCompany = db.prepare(`
            INSERT INTO campaign_companies (
                campaign_id,
                company_id,
                company_name,
                website,
                domain,
                city,
                region,
                category,
                processing_status
            )
            VALUES (
                @campaignId,
                @companyId,
                @companyName,
                @website,
                @domain,
                @city,
                @region,
                @category,
                @processingStatus
            )
        `);

        for (const company of companies) {
            insertCompany.run({
                campaignId,
                companyId: company.id,
                companyName: company.name,
                website: company.website || null,
                domain: company.domain || null,
                city: company.city || null,
                region: company.region || null,
                category: company.category || null,
                processingStatus: company.website ? "pending" : "no_site",
            });
        }

        return campaignId;
    });

    return getCampaignById(create());
};

export const updateCampaignStatus = (id, status) => {
    if (!CAMPAIGN_STATUSES.has(status)) {
        throw new Error("Некорректный статус кампании");
    }

    const result = db.prepare(`
        UPDATE campaigns
        SET
            status = @status,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
    `).run({ id, status });

    if (!result.changes) return null;

    return getCampaignById(id);
};

export const prepareCampaignScan = (campaignId) => {
    const campaign = getCampaignById(campaignId);
    if (!campaign) return null;

    const prepare = db.transaction(() => {
        /*
         * Если backend был перезапущен во время сканирования,
         * зависшие scanning возвращаем в очередь.
         */
        db.prepare(`
            UPDATE campaign_companies
            SET
                processing_status = 'pending',
                updated_at = CURRENT_TIMESTAMP
            WHERE campaign_id = ?
            AND processing_status = 'scanning'
        `).run(campaignId);

        db.prepare(`
            UPDATE campaigns
            SET
                status = 'running',
                scan_started_at = CURRENT_TIMESTAMP,
                scan_finished_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(campaignId);
    });

    prepare();

    return getCampaignById(campaignId);
};

export const pauseCampaignScanInDb = (campaignId) => {
    const result = db.prepare(`
        UPDATE campaigns
        SET
            status = 'paused',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(campaignId);

    if (!result.changes) return null;

    return getCampaignById(campaignId);
};

export const completeCampaignScan = (campaignId) => {
    db.prepare(`
        UPDATE campaigns
        SET
            status = 'completed',
            scan_finished_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(campaignId);

    return getCampaignById(campaignId);
};

export const resetCampaignErrors = (campaignId) => {
    const reset = db.transaction(() => {
        const companyIds = db.prepare(`
            SELECT company_id
            FROM campaign_companies
            WHERE campaign_id = ?
            AND processing_status = 'error'
            AND company_id IS NOT NULL
        `).all(campaignId).map((row) => row.company_id);

        const result = db.prepare(`
            UPDATE campaign_companies
            SET
                processing_status = 'pending',
                scan_error = NULL,
                scan_page_url = NULL,
                scan_forms_count = 0,
                best_form_score = 0,
                scan_forms_json = NULL,
                has_captcha = 0,
                scanned_at = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE campaign_id = ?
            AND processing_status = 'error'
            AND website IS NOT NULL
        `).run(campaignId);

        if (companyIds.length) {
            const updateBase = db.prepare(`
                UPDATE companies
                SET
                    scan_status = 'new',
                    last_scanned_at = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);

            for (const companyId of companyIds) {
                updateBase.run(companyId);
            }
        }

        return result.changes;
    });

    return reset();
};

export const claimNextCampaignCompany = (campaignId) => {
    const claim = db.transaction(() => {
        const row = db.prepare(`
            SELECT
                id,
                campaign_id,
                company_id,
                company_name,
                website,
                domain
            FROM campaign_companies
            WHERE campaign_id = ?
            AND processing_status = 'pending'
            AND website IS NOT NULL
            AND TRIM(website) <> ''
            ORDER BY id ASC
            LIMIT 1
        `).get(campaignId);

        if (!row) return null;

        const changed = db.prepare(`
            UPDATE campaign_companies
            SET
                processing_status = 'scanning',
                scan_error = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            AND processing_status = 'pending'
        `).run(row.id);

        if (!changed.changes) return null;

        return {
            id: row.id,
            campaignId: row.campaign_id,
            companyId: row.company_id,
            companyName: row.company_name,
            website: row.website,
            domain: row.domain,
        };
    });

    return claim();
};

export const saveCampaignCompanyScanSuccess = (
    campaignCompany,
    result
) => {
    const formsCount = Number(result.formsCount || 0);
    const processingStatus = formsCount > 0
        ? "form_found"
        : "no_form";

    const save = db.transaction(() => {
        db.prepare(`
            UPDATE campaign_companies
            SET
                processing_status = @processingStatus,
                scan_error = NULL,
                scan_page_url = @scanPageUrl,
                scan_forms_count = @formsCount,
                best_form_score = @bestFormScore,
                scan_forms_json = @formsJson,
                has_captcha = @hasCaptcha,
                scanned_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
        `).run({
            id: campaignCompany.id,
            processingStatus,
            scanPageUrl: result.scanPageUrl || result.url || null,
            formsCount,
            bestFormScore: Number(result.bestFormScore || 0),
            formsJson: JSON.stringify(result.forms || []),
            hasCaptcha: result.hasCaptcha ? 1 : 0,
        });

        if (campaignCompany.companyId) {
            db.prepare(`
                UPDATE companies
                SET
                    scan_status = @scanStatus,
                    last_scanned_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @companyId
            `).run({
                companyId: campaignCompany.companyId,
                scanStatus: processingStatus === "no_form"
                    ? "no_form"
                    : "scanned",
            });
        }
    });

    save();
};

export const saveCampaignCompanyScanError = (
    campaignCompany,
    error
) => {
    const message = String(
        error?.message ||
        error ||
        "Неизвестная ошибка сканирования"
    ).slice(0, 2000);

    const save = db.transaction(() => {
        db.prepare(`
            UPDATE campaign_companies
            SET
                processing_status = 'error',
                scan_error = @message,
                scanned_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
        `).run({
            id: campaignCompany.id,
            message,
        });

        if (campaignCompany.companyId) {
            db.prepare(`
                UPDATE companies
                SET
                    scan_status = 'error',
                    last_scanned_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(campaignCompany.companyId);
        }
    });

    save();
};

export const getPendingCampaignCompanyCount = (campaignId) =>
    Number(db.prepare(`
        SELECT COUNT(*) AS total
        FROM campaign_companies
        WHERE campaign_id = ?
        AND processing_status = 'pending'
        AND website IS NOT NULL
        AND TRIM(website) <> ''
    `).get(campaignId)?.total || 0);

export const deleteCampaign = (id) => {
    const remove = db.transaction(() => {
        db.prepare(`
            DELETE FROM campaign_companies
            WHERE campaign_id = ?
        `).run(id);

        return db.prepare(`
            DELETE FROM campaigns
            WHERE id = ?
        `).run(id).changes;
    });

    return remove() > 0;
};
