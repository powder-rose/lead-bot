const EXACT_BLOCKED_DOMAINS =
    new Set([
        "t.me",
        "telegram.me",
        "telegram.org",

        "wa.me",
        "whatsapp.com",
        "api.whatsapp.com",

        "max.ru",
        "web.max.ru",

        "vk.com",
        "m.vk.com",
        "ok.ru",

        "youtube.com",
        "youtu.be",
        "rutube.ru",
        "dzen.ru",

        "instagram.com",
        "facebook.com",

        "jivo.chat",
        "jivosite.com",

        "taplink.cc",
        "linktr.ee",
        "hipolink.me",

        "2gis.ru",
        "go.2gis.com",

        "yandex.ru",
        "maps.yandex.ru",
        "n.maps.yandex.ru",

        "gosuslugi.ru",
        "mos.ru",
    ]);


const BLOCKED_SUFFIXES = [
    ".gov.ru",
    ".mos.ru",
    ".mil.ru",
];


export const getDomainRejectReason =
    (
        domain = ""
    ) => {
        const value =
            String(
                domain
            )
                .trim()
                .toLowerCase()
                .replace(
                    /^www\./,
                    ""
                );


        if (!value) {
            return "empty";
        }


        if (
            EXACT_BLOCKED_DOMAINS.has(
                value
            )
        ) {
            return "blocked_domain";
        }


        if (
            BLOCKED_SUFFIXES.some(
                (
                    suffix
                ) =>
                    value.endsWith(
                        suffix
                    )
            )
        ) {
            return "blocked_suffix";
        }


        return null;
    };


export const isImportableBusinessDomain =
    (
        domain = ""
    ) =>
        !getDomainRejectReason(
            domain
        );
