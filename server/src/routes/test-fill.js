import {
    Router,
} from "express";

import {
    createBrowserSession,
    gotoSafely,
} from "../browser.js";

import {
    fillFieldSafely,
    prepareCandidateFields,
    waitForFieldGroup,
} from "../fields.js";

import {
    openFormTrigger,
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
            pageUrl,
            leadData,
            trigger,
        } =
            req.body;

        if (!pageUrl) {
            return res
                .status(400)
                .json({
                    error:
                        "Не указан адрес страницы формы",

                    data:
                        null,
                });
        }

        let browser;

        try {
            const session =
                await createBrowserSession();

            browser =
                session.browser;

            const {
                context,
                page,
            } =
                session;

            await gotoSafely(
                page,
                pageUrl
            );

            let workingPage =
                page;

            /*
             * Popup.
             */
            if (trigger) {
                const pagesBefore =
                    context.pages()
                        .length;

                const opened =
                    await openFormTrigger(
                        page,
                        trigger
                    );

                if (!opened) {
                    throw new Error(
                        `Не удалось открыть форму «${
                            trigger.text ||
                            ""
                        }»`
                    );
                }

                const pagesAfter =
                    context.pages();

                if (
                    pagesAfter.length >
                    pagesBefore
                ) {
                    workingPage =
                        pagesAfter[
                        pagesAfter.length -
                        1
                            ];

                    await workingPage
                        .waitForLoadState(
                            "domcontentloaded"
                        )
                        .catch(
                            () => {}
                        );
                }
            }

            let candidate =
                await waitForFieldGroup(
                    workingPage
                );

            if (!candidate) {
                const image =
                    await workingPage
                        .screenshot({
                            type:
                                "png",

                            fullPage:
                                false,
                        })
                        .catch(
                            () => null
                        );

                return res
                    .status(422)
                    .json({
                        error:
                            "Не обнаружены видимые поля ввода",

                        data: {
                            screenshot:
                                image
                                    ? `data:image/png;base64,${image.toString(
                                        "base64"
                                    )}`
                                    : null,
                        },
                    });
            }

            candidate =
                prepareCandidateFields(
                    candidate
                );

            const filledFields =
                [];

            const skippedFields =
                [];

            for (
                const item of
                candidate.fields
                ) {
                const {
                    field,
                    metadata,
                    detectedType,
                } =
                    item;

                if (
                    metadata.type ===
                    "checkbox" ||
                    metadata.type ===
                    "radio"
                ) {
                    skippedFields.push({
                        detectedType,

                        name:
                        metadata.name,

                        reason:
                            "Поле требует отдельной обработки",
                    });

                    continue;
                }

                const values = {
                    name:
                    leadData?.name,

                    phone:
                    leadData?.phone,

                    email:
                    leadData?.email,

                    message:
                    leadData?.message,
                };

                const value =
                    values[
                        detectedType
                        ];

                if (!value) {
                    skippedFields.push({
                        detectedType,

                        name:
                        metadata.name,

                        reason:
                            detectedType ===
                            "unknown"
                                ? "Поле не распознано"
                                : "Нет данных",
                    });

                    continue;
                }

                const success =
                    await fillFieldSafely(
                        field,
                        value,
                        metadata
                    );

                if (success) {
                    filledFields.push({
                        detectedType,

                        name:
                        metadata.name,

                        placeholder:
                        metadata.placeholder,

                        inModal:
                        metadata.inModal,
                    });
                } else {
                    skippedFields.push({
                        detectedType,

                        name:
                        metadata.name,

                        reason:
                            "Не удалось заполнить",
                    });
                }
            }

            await workingPage.waitForTimeout(
                500
            );

            const image =
                await workingPage
                    .screenshot({
                        type:
                            "png",

                        fullPage:
                            false,
                    })
                    .catch(
                        () => null
                    );

            res.json({
                error:
                    null,

                data: {
                    pageUrl,

                    filledCount:
                    filledFields.length,

                    filledFields,

                    skippedFields,

                    screenshot:
                        image
                            ? `data:image/png;base64,${image.toString(
                                "base64"
                            )}`
                            : null,

                    submitted:
                        false,

                    debug: {
                        score:
                        candidate.score,

                        frameUrl:
                        candidate.frameUrl,

                        isModal:
                        candidate.isModal,

                        fieldsFound:
                        candidate.fields
                            .length,

                        totalFrames:
                        workingPage.frames()
                            .length,
                    },
                },
            });
        } catch (error) {
            console.error(
                "TEST FILL ERROR:",
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