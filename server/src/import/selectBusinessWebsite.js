import {
    normalizeDomain,
    normalizeWebsite,
} from "../utils/domain.js";

import {
    getDomainRejectReason,
} from "./domainFilters.js";


const clean = (
    value = ""
) =>
    String(value)
        .replace(/\s+/g, " ")
        .trim();


const splitValues = (
    value = ""
) =>
    String(value)
        .split(/[\n\r;,]+/)
        .map(clean)
        .filter(Boolean);


export const selectBusinessWebsite =
    (
        rawValue = ""
    ) => {
        const values =
            splitValues(
                rawValue
            );


        if (!values.length) {
            return {
                status:
                    "empty",

                website:
                    "",

                domain:
                    "",

                rejectedDomain:
                    "",
            };
        }


        let firstRejectedDomain =
            "";

        let sawValidDomain =
            false;


        for (
            const value of
            values
        ) {
            const website =
                normalizeWebsite(
                    value
                );

            const domain =
                normalizeDomain(
                    website
                );


            if (
                !domain ||
                !domain.includes(
                    "."
                )
            ) {
                continue;
            }


            sawValidDomain =
                true;


            const rejectReason =
                getDomainRejectReason(
                    domain
                );


            if (
                rejectReason
            ) {
                if (
                    !firstRejectedDomain
                ) {
                    firstRejectedDomain =
                        domain;
                }

                continue;
            }


            /*
             * Если в одной ячейке сначала идёт
             * Telegram/Jivo/VK, а потом настоящий
             * сайт компании — берём настоящий сайт.
             */
            return {
                status:
                    "valid",

                website,

                domain,

                rejectedDomain:
                    "",
            };
        }


        if (
            sawValidDomain
        ) {
            return {
                status:
                    "excluded",

                website:
                    "",

                domain:
                    "",

                rejectedDomain:
                    firstRejectedDomain,
            };
        }


        return {
            status:
                "invalid",

            website:
                "",

            domain:
                "",

            rejectedDomain:
                "",
        };
    };
