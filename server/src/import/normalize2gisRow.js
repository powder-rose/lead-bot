import {
    normalizeDomain,
    normalizeWebsite,
} from "../utils/domain.js";


const clean = (value = "") =>
    String(value)
        .replace(/\s+/g, " ")
        .trim();


const splitValues = (value = "") =>
    String(value)
        .split(/[\n\r;,]+/)
        .map(clean)
        .filter(Boolean);


const unique = (values) =>
    [...new Set(values)];


const pickWebsite = (value = "") => {
    const websites = [];

    for (const item of splitValues(value)) {
        const website =
            normalizeWebsite(item);

        const domain =
            normalizeDomain(website);

        if (!domain || !domain.includes(".")) {
            continue;
        }

        websites.push({
            website,
            domain,
        });
    }

    return {
        primary:
            websites[0] || null,

        all:
            unique(
                websites.map(
                    (item) => item.website
                )
            ),
    };
};


export const normalize2gisRow = (
    cells,
    columns
) => {
    const get = (field) => {
        const column = columns[field];

        if (!column) {
            return "";
        }

        return clean(
            cells[column] || ""
        );
    };


    const websiteResult =
        pickWebsite(
            get("website")
        );


    const phones = unique([
        ...splitValues(
            get("phone")
        ),
        ...splitValues(
            get("mobilePhone")
        ),
    ]);


    const emails = unique(
        splitValues(
            get("email")
        )
    );


    return {
        externalId:
            get("externalId"),

        name:
            get("name"),

        region:
            get("region"),

        city:
            get("city"),

        address:
            get("address"),

        phone:
            phones.join(", "),

        phones,

        email:
            emails.join(", "),

        emails,

        website:
            websiteResult.primary
                ?.website || "",

        domain:
            websiteResult.primary
                ?.domain || "",

        websites:
            websiteResult.all,

        category:
            get("category"),

        subcategory:
            get("subcategory"),

        source:
            "2gis",
    };
};
