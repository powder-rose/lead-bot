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
        const error = new Error(
            data.error || "Ошибка запроса"
        );

        error.data = data.data;
        throw error;
    }

    return data.data;
};

export const scanSite = (url) => {
    return request("/api/scan", {
        method: "POST",
        body: JSON.stringify({ url }),
    });
};

export const testFillForm = ({
    pageUrl,
    leadData,
    trigger,
}) => {
    return request("/api/test-fill", {
        method: "POST",
        body: JSON.stringify({
            pageUrl,
            leadData,
            trigger,
        }),
    });
};
