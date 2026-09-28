import {
    Router,
} from "express";

import {
    createBrowserSession,
    gotoSafely,
} from "../browser.js";

import {
    analyzeForm,
    createFormSignature,
    findCandidateLinks,
    scanPageForms,
    scanPopupForms,
} from "../scanner.js";


const router =
    Router();


router.post(
    "/",
    async (
        req,
        res
    ) => {
        const {
            url,
        } =
            req.body;

        if (!url) {
            return res
                .status(400)
                .json({
                    error:
                        "Не указан URL сайта",

                    data:
                        null,
                });
        }

        let browser;

        try {
            const parsed =
                new URL(
                    url
                );

            if (
                ![
                    "http:",
                    "https:",
                ].includes(
                    parsed.protocol
                )
            ) {
                throw new Error(
                    "Разрешены только HTTP и HTTPS сайты"
                );
            }

            const session =
                await createBrowserSession();

            browser =
                session.browser;

            const page =
                session.page;

            const response =
                await gotoSafely(
                    page,
                    url
                );

            const finalUrl =
                page.url();

            const title =
                await page.title();

            const scannedPages =
                [];

            const scanErrors =
                [];

            const allForms =
                [];

            /*
             * Главная страница.
             */
            const pageForms =
                await scanPageForms(
                    page
                );

            const visibleForms =
                pageForms.filter(
                    (
                        form
                    ) =>
                        form.visible
                );

            allForms.push(
                ...visibleForms
            );

            const popupForms =
                await scanPopupForms(
                    page,
                    finalUrl
                );

            allForms.push(
                ...popupForms
            );

            scannedPages.push({
                url:
                finalUrl,

                title,

                type:
                    "home",

                status:
                    response?.status() ||
                    null,

                formsFound:
                    visibleForms.length +
                    popupForms.length,
            });

            /*
             * Возвращаемся на главную.
             */
            await gotoSafely(
                page,
                finalUrl
            );

            /*
             * Внутренние страницы.
             */
            const links =
                await findCandidateLinks(
                    page,
                    finalUrl
                );

            for (
                const candidate of
                links
                ) {
                if (
                    candidate.url ===
                    finalUrl
                ) {
                    continue;
                }

                try {
                    const response =
                        await gotoSafely(
                            page,
                            candidate.url,
                            {
                                attempts:
                                    3,
                            }
                        );

                    const forms =
                        await scanPageForms(
                            page
                        );

                    const visible =
                        forms.filter(
                            (
                                form
                            ) =>
                                form.visible
                        );

                    allForms.push(
                        ...visible
                    );

                    const popups =
                        await scanPopupForms(
                            page,
                            page.url()
                        );

                    allForms.push(
                        ...popups
                    );

                    scannedPages.push({
                        url:
                        candidate.url,

                        title:
                            await page.title(),

                        type:
                            "candidate",

                        linkText:
                        candidate.text,

                        status:
                            response?.status() ||
                            null,

                        formsFound:
                            visible.length +
                            popups.length,
                    });
                } catch (error) {
                    scanErrors.push({
                        url:
                        candidate.url,

                        error:
                        error.message,
                    });
                }
            }

            /*
             * Дубли.
             */
            const unique =
                new Map();

            for (
                const form of
                allForms
                ) {
                const signature =
                    createFormSignature(
                        form
                    );

                const current =
                    unique.get(
                        signature
                    );

                if (!current) {
                    unique.set(
                        signature,
                        form
                    );
                } else if (
                    !current.trigger &&
                    form.trigger
                ) {
                    unique.set(
                        signature,
                        form
                    );
                }
            }

            /*
             * Анализ.
             */
            const forms =
                [
                    ...unique.values(),
                ]
                    .map(
                        (
                            form
                        ) => {
                            const analysis =
                                analyzeForm(
                                    form
                                );

                            return {
                                ...form,

                                fields:
                                analysis.realFields,

                                ...analysis,
                            };
                        }
                    )
                    .filter(
                        (
                            form
                        ) =>
                            form.relevant
                    )
                    .sort(
                        (a, b) =>
                            b.score -
                            a.score
                    )
                    .map(
                        (
                            form,
                            index
                        ) => ({
                            ...form,

                            formIndex:
                            index,

                            recommended:
                                index ===
                                0,
                        })
                    );

            res.json({
                error: null,

                data: {
                    url:
                    finalUrl,

                    title,

                    formsCount:
                    forms.length,

                    forms,

                    scannedPages,

                    scanErrors,
                },
            });
        } catch (error) {
            console.error(
                "SCAN ERROR:",
                error.message
            );

            res.status(500)
                .json({
                    error:
                    error.message,

                    data:
                        null,
                });
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
);


export default router;