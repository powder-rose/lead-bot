import {
    claimNextCampaignCompany,
    completeCampaignScan,
    getCampaignById,
    getPendingCampaignCompanyCount,
    pauseCampaignScanInDb,
    prepareCampaignScan,
    resetCampaignErrors,
    saveCampaignCompanyScanError,
    saveCampaignCompanyScanSuccess,
} from "./campaigns.service.js";

import {
    scanWebsiteThroughLeadBot,
} from "./campaignScanAdapter.js";

const runners = new Map();

const CONCURRENCY = Math.min(
    Math.max(
        Number(process.env.CAMPAIGN_SCAN_CONCURRENCY) || 2,
        1
    ),
    3
);

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const getRunner = (campaignId) =>
    runners.get(Number(campaignId)) || null;

const runWorker = async (campaignId, runner) => {
    while (!runner.paused) {
        const company = claimNextCampaignCompany(campaignId);

        if (!company) {
            return;
        }

        runner.active += 1;

        try {
            const result = await scanWebsiteThroughLeadBot(
                company.website
            );

            saveCampaignCompanyScanSuccess(
                company,
                result
            );
        } catch (error) {
            saveCampaignCompanyScanError(
                company,
                error
            );
        } finally {
            runner.active = Math.max(
                runner.active - 1,
                0
            );
        }

        /*
         * Небольшая пауза между сайтами уменьшает
         * нагрузку и делает массовую проверку спокойнее.
         */
        await sleep(350);
    }
};

const launch = async (campaignId, runner) => {
    try {
        await Promise.allSettled(
            Array.from(
                { length: CONCURRENCY },
                () => runWorker(campaignId, runner)
            )
        );

        if (runner.paused) {
            pauseCampaignScanInDb(campaignId);
            return;
        }

        const pending = getPendingCampaignCompanyCount(
            campaignId
        );

        if (pending === 0) {
            completeCampaignScan(campaignId);
        }
    } finally {
        runners.delete(Number(campaignId));
    }
};

export const startCampaignScan = (campaignId) => {
    const id = Number(campaignId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Некорректный ID кампании");
    }

    const existing = getRunner(id);

    if (existing) {
        return {
            started: false,
            alreadyRunning: true,
            concurrency: CONCURRENCY,
            campaign: getCampaignById(id),
        };
    }

    const campaign = prepareCampaignScan(id);

    if (!campaign) {
        return null;
    }

    const pending = getPendingCampaignCompanyCount(id);

    if (pending === 0) {
        completeCampaignScan(id);

        return {
            started: false,
            alreadyRunning: false,
            concurrency: CONCURRENCY,
            campaign: getCampaignById(id),
        };
    }

    const runner = {
        paused: false,
        active: 0,
        startedAt: Date.now(),
    };

    runners.set(id, runner);

    /*
     * Не await: HTTP-запрос сразу отвечает интерфейсу,
     * а сканирование идёт в фоне внутри backend.
     */
    launch(id, runner).catch((error) => {
        console.error(
            `CAMPAIGN SCAN ${id} FATAL ERROR:`,
            error.message
        );

        runners.delete(id);
        pauseCampaignScanInDb(id);
    });

    return {
        started: true,
        alreadyRunning: false,
        concurrency: CONCURRENCY,
        campaign: getCampaignById(id),
    };
};

export const pauseCampaignScan = (campaignId) => {
    const id = Number(campaignId);
    const runner = getRunner(id);

    if (runner) {
        runner.paused = true;
    }

    const campaign = pauseCampaignScanInDb(id);

    if (!campaign) {
        return null;
    }

    return {
        paused: true,
        active: runner?.active || 0,
        campaign,
    };
};

export const retryCampaignErrors = (campaignId) => {
    const id = Number(campaignId);

    const reset = resetCampaignErrors(id);

    if (!getCampaignById(id)) {
        return null;
    }

    const result = startCampaignScan(id);

    return {
        reset,
        ...result,
    };
};

export const getCampaignRunnerState = (campaignId) => {
    const id = Number(campaignId);
    const runner = getRunner(id);
    const campaign = getCampaignById(id);

    if (!campaign) {
        return null;
    }

    return {
        running: Boolean(runner),
        paused: Boolean(runner?.paused),
        active: runner?.active || 0,
        concurrency: CONCURRENCY,
        campaign,
    };
};
