import { Router } from "express";

import {
    createCampaign,
    deleteCampaign,
    getCampaignById,
    getCampaignCompanies,
    getCampaignCompanyScanResult,
    getCampaigns,
    updateCampaignStatus,
} from "../services/campaigns.service.js";

import {
    getCampaignRunnerState,
    pauseCampaignScan,
    retryCampaignErrors,
    startCampaignScan,
} from "../services/campaignScanRunner.js";

const router = Router();

router.get("/", (req, res) => {
    try {
        res.json({
            error: null,
            data: getCampaigns(),
        });
    } catch (error) {
        console.error("GET CAMPAIGNS ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить кампании",
            data: null,
        });
    }
});

router.post("/", (req, res) => {
    try {
        const campaign = createCampaign(req.body);

        res.status(201).json({
            error: null,
            data: campaign,
        });
    } catch (error) {
        console.error("CREATE CAMPAIGN ERROR:", error.message);

        res.status(400).json({
            error: error.message || "Не удалось создать кампанию",
            data: null,
        });
    }
});

router.post("/:id/scan/start", (req, res) => {
    try {
        const result = startCampaignScan(req.params.id);

        if (!result) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: result,
        });
    } catch (error) {
        console.error("START CAMPAIGN SCAN ERROR:", error.message);

        res.status(400).json({
            error: error.message || "Не удалось запустить проверку",
            data: null,
        });
    }
});

router.post("/:id/scan/pause", (req, res) => {
    try {
        const result = pauseCampaignScan(req.params.id);

        if (!result) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: result,
        });
    } catch (error) {
        console.error("PAUSE CAMPAIGN SCAN ERROR:", error.message);

        res.status(400).json({
            error: error.message || "Не удалось поставить проверку на паузу",
            data: null,
        });
    }
});

router.post("/:id/scan/retry-errors", (req, res) => {
    try {
        const result = retryCampaignErrors(req.params.id);

        if (!result) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: result,
        });
    } catch (error) {
        console.error("RETRY CAMPAIGN ERRORS ERROR:", error.message);

        res.status(400).json({
            error: error.message || "Не удалось повторить ошибки",
            data: null,
        });
    }
});

router.get("/:id/scan/state", (req, res) => {
    try {
        const result = getCampaignRunnerState(req.params.id);

        if (!result) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: result,
        });
    } catch (error) {
        console.error("GET CAMPAIGN SCAN STATE ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить состояние проверки",
            data: null,
        });
    }
});

router.get("/:id/companies/:companyRowId/scan-result", (req, res) => {
    try {
        const result = getCampaignCompanyScanResult(
            req.params.id,
            req.params.companyRowId
        );

        if (!result) {
            return res.status(404).json({
                error: "Результат компании не найден",
                data: null,
            });
        }

        res.json({
            error: null,
            data: result,
        });
    } catch (error) {
        console.error("GET COMPANY SCAN RESULT ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить результат сканирования",
            data: null,
        });
    }
});

router.get("/:id/companies", (req, res) => {
    try {
        const campaign = getCampaignById(req.params.id);

        if (!campaign) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: getCampaignCompanies(req.params.id, {
                page: req.query.page,
                limit: req.query.limit,
                processingStatus: req.query.processingStatus,
            }),
        });
    } catch (error) {
        console.error("GET CAMPAIGN COMPANIES ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить компании кампании",
            data: null,
        });
    }
});

router.get("/:id", (req, res) => {
    try {
        const campaign = getCampaignById(req.params.id);

        if (!campaign) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: campaign,
        });
    } catch (error) {
        console.error("GET CAMPAIGN ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось получить кампанию",
            data: null,
        });
    }
});

router.patch("/:id/status", (req, res) => {
    try {
        const campaign = updateCampaignStatus(
            req.params.id,
            String(req.body.status || "")
        );

        if (!campaign) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: campaign,
        });
    } catch (error) {
        console.error("UPDATE CAMPAIGN STATUS ERROR:", error.message);

        res.status(400).json({
            error: error.message || "Не удалось изменить статус кампании",
            data: null,
        });
    }
});

router.delete("/:id", (req, res) => {
    try {
        const deleted = deleteCampaign(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                error: "Кампания не найдена",
                data: null,
            });
        }

        res.json({
            error: null,
            data: { deleted: true },
        });
    } catch (error) {
        console.error("DELETE CAMPAIGN ERROR:", error.message);

        res.status(500).json({
            error: "Не удалось удалить кампанию",
            data: null,
        });
    }
});

export default router;
