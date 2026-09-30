import { Router } from "express";
import campaignsRouter from "./campaigns.js";
import {
    createCompany,
    deleteAllCompanies,
    deleteCompany,
    getCompanies,
    getCompanyById,
    getCompanyFilters,
    updateCompany,
} from "../services/companies.service.js";

const router = Router();

const SCAN_STATUSES = [
    "new",
    "scanned",
    "no_form",
    "error",
];

router.get("/", (req, res) => {
    try {
        const data = getCompanies({
            search: req.query.search,
            scanStatus: req.query.scanStatus,
            category: req.query.category,
            city: req.query.city,
            region: req.query.region,
            page: req.query.page,
            limit: req.query.limit,
        });

        res.json({
            error: null,
            data,
        });
    } catch (error) {
        console.error("GET COMPANIES ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить компании",
            data: null,
        });
    }
});

/*
 * Кампании подключены здесь, чтобы patch не требовал
 * ручного изменения server.js. Итоговый API:
 * /api/companies/campaigns
 */
router.use("/campaigns", campaignsRouter);

router.get("/filters", (req, res) => {
    try {
        res.json({
            error: null,
            data: getCompanyFilters(),
        });
    } catch (error) {
        console.error(
            "GET COMPANY FILTERS ERROR:",
            error.message
        );

        res.status(500).json({
            error:
                "Не удалось получить фильтры",
            data: null,
        });
    }
});

router.get("/:id", (req, res) => {
    try {
        const company = getCompanyById(req.params.id);

        if (!company) {
            return res.status(404).json({
                error: "Компания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: company,
        });
    } catch (error) {
        console.error("GET COMPANY ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить компанию",
            data: null,
        });
    }
});

router.post("/", (req, res) => {
    try {
        if (!req.body.name?.trim()) {
            return res.status(400).json({
                error: "Название компании обязательно",
                data: null,
            });
        }

        const company = createCompany(req.body);

        res.status(201).json({
            error: null,
            data: company,
        });
    } catch (error) {
        console.error("CREATE COMPANY ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось создать компанию",
            data: null,
        });
    }
});

router.patch("/:id", (req, res) => {
    try {
        if (
            req.body.name !== undefined &&
            !req.body.name.trim()
        ) {
            return res.status(400).json({
                error: "Название компании обязательно",
                data: null,
            });
        }

        if (
            req.body.scanStatus &&
            !SCAN_STATUSES.includes(req.body.scanStatus)
        ) {
            return res.status(400).json({
                error: "Некорректный статус сканирования",
                data: null,
            });
        }

        const company = updateCompany(
            req.params.id,
            req.body
        );

        if (!company) {
            return res.status(404).json({
                error: "Компания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: company,
        });
    } catch (error) {
        console.error("UPDATE COMPANY ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось обновить компанию",
            data: null,
        });
    }
});

router.delete("/all", (req, res) => {
    try {
        const deleted = deleteAllCompanies();

        res.json({
            error: null,
            data: {
                deleted,
                message: "База компаний очищена",
            },
        });
    } catch (error) {
        console.error("CLEAR COMPANIES ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось очистить базу компаний",
            data: null,
        });
    }
});

router.delete("/:id", (req, res) => {
    try {
        const deleted = deleteCompany(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                error: "Компания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: {
                deleted: true,
            },
        });
    } catch (error) {
        console.error("DELETE COMPANY ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось удалить компанию",
            data: null,
        });
    }
});

export default router;
