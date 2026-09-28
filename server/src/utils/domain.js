export const normalizeDomain = (
    website = ""
) => {
    const value =
        website.trim();

    if (!value) {
        return "";
    }

    try {
        const url =
            new URL(
                value.startsWith(
                    "http://"
                ) ||
                value.startsWith(
                    "https://"
                )
                    ? value
                    : `https://${value}`
            );

        return url.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );
    } catch {
        return "";
    }
};


export const normalizeWebsite = (
    website = ""
) => {
    const value =
        website.trim();

    if (!value) {
        return "";
    }

    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    ) {
        return value;
    }

    return `https://${value}`;
};