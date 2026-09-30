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


/*
 * Сколько внутренних страниц
 * одного сайта разрешено анализировать
 * одновременно.
 *
 * 3 — хороший баланс между скоростью
 * и нагрузкой на RAM/CPU.
 */
const CANDIDATE_CONCURRENCY =
    3;


/*
 * Небольшой concurrency pool.
 *
 * Promise.all для всех страниц сразу
 * использовать не стоит:
 * на больших объёмах можно легко
 * забить память.
 */
const mapWithConcurrency =
    async (
        items,
        limit,
        worker
    ) => {
        if (!items.length) {
            return [];
        }

        const results =
            new Array(
                items.length
            );

        let nextIndex =
            0;

        const runWorker =
            async () => {
                while (true) {
                    const index =
                        nextIndex++;

                    if (
                        index >=
                        items.length
                    ) {
                        return;
                    }

                    results[index] =
                        await worker(
                            items[index],
                            index
                        );
                }
            };

        const workersCount =
            Math.min(
                Math.max(
                    Number(limit) || 1,
                    1
                ),
                items.length
            );

        await Promise.all(
            Array.from(
                {
                    length:
                    workersCount,
                },
                () => runWorker()
            )
        );

        return results;
    };


/*
 * Анализ одной внутренней страницы.
 *
 * Важно:
 * для неё создаётся отдельный context,
 * но НЕ отдельный Chromium.
 */
const scanCandidate =
    async (
        candidate,
        storageState
    ) => {
        let session;

        try {
            session =
                await createBrowserSession({
                    blockHeavyResources:
                        true,

                    /*
                     * Передаём cookies/localStorage
                     * с главной страницы.
                     */
                    storageState,
                });

            const page =
                session.page;

            const response =
                await gotoSafely(
                    page,
                    candidate.url,
                    {
                        attempts:
                            2,

                        timeout:
                            18000,
                    }
                );

            /*
             * URL может измениться после
             * redirect.
             */
            const finalUrl =
                page.url();

            /*
             * Заголовок сохраняем ДО popup-
             * анализа, потому что popup
             * потенциально может изменить URL.
             */
            const title =
                await page.title();

            /*
             * Обычные формы страницы.
             */
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

            /*
             * Popup/callback формы.
             */
            const popups =
                await scanPopupForms(
                    page,
                    finalUrl,
                    {
                        skipInitialNavigation:
                            true,
                     }
                );

            return {
                forms: [
                    ...visible,
                    ...popups,
                ],

                page: {
                    url:
                    finalUrl,

                    title,

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
                },

                error:
                    null,
            };
        } catch (error) {
            return {
                forms:
                    [],

                page:
                    null,

                error: {
                    url:
                    candidate.url,

                    error:
                    error.message,
                },
            };
        } finally {
            /*
             * Закрываем context.
             *
             * Chromium НЕ закрываем.
             */
            if (session) {
                await session.close();
            }
        }
    };


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

        let session;

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

            session =
                await createBrowserSession({
                    blockHeavyResources:
                        true,
                });

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
             * =================================
             * ГЛАВНАЯ СТРАНИЦА
             * =================================
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

            /*
             * Ищем popup/callback формы.
             */
            const popupForms =
                await scanPopupForms(
                    page,
                    finalUrl,
                    {
                        skipInitialNavigation:
                            true,
                    }
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
             * scanPopupForms нажимает кнопки.
             *
             * Поэтому перед анализом ссылок
             * возвращаем сайт в чистое состояние.
             */
            await gotoSafely(
                page,
                finalUrl,
                {
                    attempts:
                        2,
                }
            );


            /*
             * =================================
             * ИЩЕМ ПОЛЕЗНЫЕ ВНУТРЕННИЕ СТРАНИЦЫ
             * =================================
             */

            const links =
                await findCandidateLinks(
                    page,
                    finalUrl
                );

            const candidates =
                links.filter(
                    (
                        candidate
                    ) =>
                        candidate.url !==
                        finalUrl
                );


            /*
             * Получаем состояние главной страницы.
             *
             * Благодаря этому candidate context
             * получает те же cookies/localStorage.
             */
            const storageState =
                await session.context
                    .storageState()
                    .catch(
                        () => undefined
                    );


            /*
             * =================================
             * ПАРАЛЛЕЛЬНЫЙ АНАЛИЗ
             * =================================
             *
             * Было:
             *
             * страница 1
             *   ↓
             * страница 2
             *   ↓
             * страница 3
             *
             * Стало:
             *
             * страница 1 ─┐
             * страница 2 ─┼─ одновременно
             * страница 3 ─┘
             */
            const candidateResults =
                await mapWithConcurrency(
                    candidates,
                    CANDIDATE_CONCURRENCY,
                    (
                        candidate
                    ) =>
                        scanCandidate(
                            candidate,
                            storageState
                        )
                );


            /*
             * Собираем результаты.
             */
            for (
                const result of
                candidateResults
                ) {
                if (!result) {
                    continue;
                }

                if (
                    result.forms?.length
                ) {
                    allForms.push(
                        ...result.forms
                    );
                }

                if (result.page) {
                    scannedPages.push(
                        result.page
                    );
                }

                if (result.error) {
                    scanErrors.push(
                        result.error
                    );
                }
            }


            /*
             * =================================
             * УБИРАЕМ ДУБЛИ
             * =================================
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
                    /*
                     * Если одна и та же форма
                     * была найдена как обычная
                     * и как popup — сохраняем
                     * popup-вариант с trigger.
                     */
                    unique.set(
                        signature,
                        form
                    );
                }
            }


            /*
             * =================================
             * ОЦЕНКА ФОРМ
             * =================================
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
                        (
                            a,
                            b
                        ) =>
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
                error:
                    null,

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
            /*
             * КРИТИЧЕСКИ ВАЖНО:
             *
             * browser.close() здесь больше
             * вызывать нельзя.
             *
             * Закрываем только context.
             */
            if (session) {
                await session.close();
            }
        }
    }
);


export default router;