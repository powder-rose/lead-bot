import { API_URL } from "../constants/api.js";

const request = async (
    path,
    options = {}
) => {
    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
        throw new Error(
            data.error ||
            "Ошибка запроса"
        );
    }

    return data.data;
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
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (scanStatus) params.set("scanStatus", scanStatus);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (region) params.set("region", region);

    params.set("page", page);
    params.set("limit", limit);

    return request(
        `/api/companies?${params.toString()}`
    );
};

export const getCompanyFilters = () =>
    request("/api/companies/filters");

export const createCompany = (company) =>
    request("/api/companies", {
        method: "POST",
        body: JSON.stringify(company),
    });

export const updateCompany = (id, company) =>
    request(`/api/companies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(company),
    });

export const deleteCompany = (id) =>
    request(`/api/companies/${id}`, {
        method: "DELETE",
    });

export const deleteAllCompanies = () =>
    request("/api/companies/all", {
        method: "DELETE",
    });
