import {
    API_URL,
} from "../constants/api.js";


const readResponse =
    async (
        response
    ) => {
        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {
            throw new Error(
                data.error ||
                "Ошибка импорта"
            );
        }


        return data.data;
    };


export const previewCompaniesImport =
    async (
        file
    ) => {
        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        const response =
            await fetch(
                `${API_URL}/api/companies/import/preview`,
                {
                    method:
                        "POST",

                    body:
                        formData,
                }
            );


        return readResponse(
            response
        );
    };


export const analyzeCompaniesImport =
    async (
        importId
    ) => {
        const response =
            await fetch(
                `${API_URL}/api/companies/import/analyze`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            importId,
                        }),
                }
            );


        return readResponse(
            response
        );
    };


export const getCompaniesImportRubrics =
    async (
        importId
    ) => {
        const response =
            await fetch(
                `${API_URL}/api/companies/import/rubrics`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            importId,
                        }),
                }
            );


        return readResponse(
            response
        );
    };


export const analyzeCompaniesImportSelection =
    async ({
        importId,
        categories,
        subcategories,
    }) => {
        const response =
            await fetch(
                `${API_URL}/api/companies/import/selection-preview`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            importId,
                            categories,
                            subcategories,
                        }),
                }
            );


        return readResponse(
            response
        );
    };



export const commitCompaniesImport =
    async ({
        importId,
        categories,
        subcategories,
    }) => {
        const response =
            await fetch(
                `${API_URL}/api/companies/import/commit`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            importId,
                            categories,
                            subcategories,
                        }),
                }
            );


        return readResponse(
            response
        );
    };


export const discardCompaniesImport =
    async (
        importId
    ) => {
        if (
            !importId
        ) {
            return null;
        }


        const response =
            await fetch(
                `${API_URL}/api/companies/import/discard`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({
                            importId,
                        }),
                }
            );


        return readResponse(
            response
        );
    };
