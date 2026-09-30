import { db } from "../db/database.js";
import { normalizeDomain, normalizeWebsite } from "../utils/domain.js";

const mapCompany = (company) => {
    if (!company) return null;

    return {
        id: company.id,
        name: company.name,
        website: company.website,
        domain: company.domain,
        phone: company.phone,
        email: company.email ?? null,
        address: company.address ?? null,
        city: company.city,
        region: company.region,
        category: company.category,
        subcategory: company.subcategory ?? null,
        externalId: company.external_id ?? null,
        source: company.source,
        scanStatus: company.scan_status,
        lastScannedAt: company.last_scanned_at,
        createdAt: company.created_at,
        updatedAt: company.updated_at,
    };
};

export const getCompanies = ({
    search = "",
    scanStatus = "",
    category = "",
    city = "",
    region = "",
    page = 1,
    limit = 25,
} = {}) => {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const where = [];
    const params = {};

    const normalizedSearch = String(search).trim();
    const normalizedStatus = String(scanStatus).trim();
    const normalizedCategory = String(category).trim();
    const normalizedCity = String(city).trim();
    const normalizedRegion = String(region).trim();

    if (normalizedSearch) {
        where.push(`
            (
                name LIKE @search
                OR website LIKE @search
                OR domain LIKE @search
                OR phone LIKE @search
                OR email LIKE @search
                OR address LIKE @search
                OR city LIKE @search
                OR region LIKE @search
                OR category LIKE @search
                OR subcategory LIKE @search
            )
        `);

        params.search = `%${normalizedSearch}%`;
    }

    if (normalizedStatus) {
        where.push("scan_status = @scanStatus");
        params.scanStatus = normalizedStatus;
    }

    if (normalizedCategory) {
        where.push("category LIKE @category");
        params.category = `%${normalizedCategory}%`;
    }

    if (normalizedCity) {
        where.push("city = @city");
        params.city = normalizedCity;
    }

    if (normalizedRegion) {
        where.push("region = @region");
        params.region = normalizedRegion;
    }

    const whereSql = where.length
        ? `WHERE ${where.join(" AND ")}`
        : "";

    const totalRow = db.prepare(`
        SELECT COUNT(*) AS total
        FROM companies
        ${whereSql}
    `).get(params);

    const rows = db.prepare(`
        SELECT *
        FROM companies
        ${whereSql}
        ORDER BY id DESC
        LIMIT @limit
        OFFSET @offset
    `).all({
        ...params,
        limit: safeLimit,
        offset,
    });

    const total = Number(totalRow.total || 0);

    return {
        companies: rows.map(mapCompany),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            lastPage: Math.max(Math.ceil(total / safeLimit), 1),
        },
    };
};

export const getCompanyFilters = () => {
    const getDistinct = (column) =>
        db.prepare(`
            SELECT DISTINCT TRIM(${column}) AS value
            FROM companies
            WHERE ${column} IS NOT NULL
              AND TRIM(${column}) <> ''
            ORDER BY value COLLATE NOCASE
        `)
            .all()
            .map(
                (row) =>
                    row.value
            );

    const locations =
        db.prepare(`
            SELECT DISTINCT
                TRIM(city) AS city,
                TRIM(region) AS region
            FROM companies
            WHERE city IS NOT NULL
              AND TRIM(city) <> ''
              AND region IS NOT NULL
              AND TRIM(region) <> ''
            ORDER BY
                region COLLATE NOCASE,
                city COLLATE NOCASE
        `)
            .all()
            .map(
                (row) => ({
                    city:
                        row.city,

                    region:
                        row.region,
                })
            );

    return {
        statuses: [
            "new",
            "scanned",
            "no_form",
            "error",
        ],

        categories:
            getDistinct(
                "category"
            ),

        cities:
            getDistinct(
                "city"
            ),

        regions:
            getDistinct(
                "region"
            ),

        locations,
    };
};

export const getCompanyById = (id) => {
    const company = db.prepare(`
        SELECT *
        FROM companies
        WHERE id = ?
    `).get(id);

    return mapCompany(company);
};

export const createCompany = (data) => {
    const website = normalizeWebsite(data.website || "");
    const domain = normalizeDomain(website);

    const result = db.prepare(`
        INSERT INTO companies (
            name,
            website,
            domain,
            phone,
            city,
            region,
            category,
            source
        )
        VALUES (
            @name,
            @website,
            @domain,
            @phone,
            @city,
            @region,
            @category,
            @source
        )
    `).run({
        name: data.name.trim(),
        website: website || null,
        domain: domain || null,
        phone: data.phone?.trim() || null,
        city: data.city?.trim() || null,
        region: data.region?.trim() || null,
        category: data.category?.trim() || null,
        source: data.source?.trim() || "manual",
    });

    return getCompanyById(result.lastInsertRowid);
};

export const updateCompany = (id, data) => {
    const current = getCompanyById(id);
    if (!current) return null;

    const nextWebsite = data.website !== undefined
        ? normalizeWebsite(data.website || "")
        : current.website;

    const nextDomain = data.website !== undefined
        ? normalizeDomain(nextWebsite)
        : current.domain;

    db.prepare(`
        UPDATE companies
        SET
            name = @name,
            website = @website,
            domain = @domain,
            phone = @phone,
            city = @city,
            region = @region,
            category = @category,
            source = @source,
            scan_status = @scanStatus,
            last_scanned_at = @lastScannedAt,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
    `).run({
        id,
        name: data.name !== undefined ? data.name.trim() : current.name,
        website: nextWebsite || null,
        domain: nextDomain || null,
        phone: data.phone !== undefined ? data.phone?.trim() || null : current.phone,
        city: data.city !== undefined ? data.city?.trim() || null : current.city,
        region: data.region !== undefined ? data.region?.trim() || null : current.region,
        category: data.category !== undefined ? data.category?.trim() || null : current.category,
        source: data.source !== undefined ? data.source?.trim() || "manual" : current.source,
        scanStatus: data.scanStatus !== undefined ? data.scanStatus : current.scanStatus,
        lastScannedAt: data.lastScannedAt !== undefined ? data.lastScannedAt || null : current.lastScannedAt,
    });

    return getCompanyById(id);
};

export const deleteCompany = (id) => {
    const result = db.prepare(`
        DELETE FROM companies
        WHERE id = ?
    `).run(id);

    return result.changes > 0;
};

export const deleteAllCompanies = () => {
    const clearDatabase = db.transaction(() => {
        const result = db.prepare(`
            DELETE FROM companies
        `).run();

        db.prepare(`
            DELETE FROM sqlite_sequence
            WHERE name = 'companies'
        `).run();

        return result.changes;
    });

    return clearDatabase();
};
