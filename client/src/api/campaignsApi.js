import { API_URL } from "../constants/api.js";

const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(data.error || "Ошибка запроса");
    }

    return data.data;
};

const BASE_URL = "/api/companies/campaigns";

export const getCampaigns = () =>
    request(BASE_URL);

export const createCampaign = (campaign) =>
    request(BASE_URL, {
        method: "POST",
        body: JSON.stringify(campaign),
    });

export const getCampaignCompanies = (
    campaignId,
    {
        page = 1,
        limit = 25,
        processingStatus = "",
    } = {}
) => {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    if (processingStatus) {
        params.set(
            "processingStatus",
            processingStatus
        );
    }

    return request(
        `${BASE_URL}/${campaignId}/companies?${params.toString()}`
    );
};

export const getCampaignCompanyScanResult = (
    campaignId,
    campaignCompanyId
) =>
    request(
        `${BASE_URL}/${campaignId}/companies/${campaignCompanyId}/scan-result`
    );

export const updateCampaignStatus = (campaignId, status) =>
    request(`${BASE_URL}/${campaignId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });

export const startCampaignScan = (campaignId) =>
    request(`${BASE_URL}/${campaignId}/scan/start`, {
        method: "POST",
    });

export const pauseCampaignScan = (campaignId) =>
    request(`${BASE_URL}/${campaignId}/scan/pause`, {
        method: "POST",
    });

export const retryCampaignScanErrors = (campaignId) =>
    request(`${BASE_URL}/${campaignId}/scan/retry-errors`, {
        method: "POST",
    });

export const getCampaignScanState = (campaignId) =>
    request(`${BASE_URL}/${campaignId}/scan/state`);

export const deleteCampaign = (campaignId) =>
    request(`${BASE_URL}/${campaignId}`, {
        method: "DELETE",
    });
