import {
    Router,
} from "express";

import {
    createBrowserSession,
    gotoSafely,
} from "../browser.js";

import {
    captureCandidateScreenshot,
    fillFieldSafely,
    findFieldGroupByFormIndex,
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
            formHint,
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

        let session;

        try {
            session =
                await createBrowserSession({
                    blockHeavyResources:
                        false,
                });

            const {
                context,
                page,
            } =
                session;

            await gotoSafely(
                page,
                pageUrl,
                {
                    attempts:
                        2,

                    timeout:
                        15000,

                    settleDelay:
                        150,
                }
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
                null;

            if (
                Number.isInteger(
                    formHint
                        ?.sourceFormIndex
                ) &&
                formHint.sourceFormIndex >=
                0
            ) {
                candidate =
                    await findFieldGroupByFormIndex(
                        workingPage,
                        formHint
                            .sourceFormIndex
                    );
            }


            if (!candidate) {
                candidate =
                    await waitForFieldGroup(
                        workingPage,
                        3500
                    );
            }

            if (!candidate) {
                return res
                    .status(422)
                    .json({
                        error:
                            "Не обнаружены видимые поля ввода",

                        data: {
                            screenshot:
                                null,

                            diagnostic: {
                                pageUrl:
                                    workingPage.url(),

                                triggerUsed:
                                    Boolean(
                                        trigger
                                    ),

                                fastPathAttempted:
                                    Number.isInteger(
                                        formHint
                                            ?.sourceFormIndex
                                    ),

                                sourceFormIndex:
                                    formHint
                                        ?.sourceFormIndex ??
                                    null,

                                frames:
                                    workingPage
                                        .frames()
                                        .length,
                                },
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

                    subject:
                    leadData?.subject,

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
                120
            );

            const image =
                await captureCandidateScreenshot(
                    workingPage,
                    candidate
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

                        fastPath:
                            candidate.fastPath ===
                            true,

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
            if (session) {
                await session.close();
            }
        }
    }
);


export default router;