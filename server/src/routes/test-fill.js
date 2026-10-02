import {
    Router,
} from "express";

import {
    createBrowserSession,
    gotoSafely,
} from "../browser.js";

import {
    applyFormFieldValue,
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
            fillMode = "auto",
            fieldValues = [],
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


            /*
             * Группы radio, которые мы
             * уже обработали.
             *
             * У radio обычно несколько вариантов
             * с одинаковым name.
             */
            const processedRadioGroups =
                new Set();


            /*
             * Выбираем случайный нормальный
             * вариант из <select>.
             *
             * Не берём:
             * - пустые значения;
             * - disabled;
             * - "Выберите";
             * - "Не выбрано";
             * - похожие placeholder-варианты.
             */
            const getRandomSelectOption =
                (
                    metadata
                ) => {
                    const ignoredWords = [
                        "выберите",
                        "выбрать",
                        "не выбрано",
                        "не выбран",
                        "не выбрана",
                        "не выбраны",
                        "select",
                        "choose",
                        "please select",
                        "не указано",
                        "none",
                        "—",
                        "-",
                    ];


                    const availableOptions =
                        (
                            metadata.options ||
                            []
                        )
                            .filter(
                                (
                                    option
                                ) => {
                                    if (
                                        option.disabled
                                    ) {
                                        return false;
                                    }


                                    const value =
                                        String(
                                            option.value ??
                                            ""
                                        ).trim();


                                    if (!value) {
                                        return false;
                                    }


                                    const label =
                                        String(
                                            option.label ||
                                            ""
                                        )
                                            .trim()
                                            .toLowerCase();


                                    if (!label) {
                                        return false;
                                    }


                                    const ignored =
                                        ignoredWords.some(
                                            (
                                                word
                                            ) =>
                                                label ===
                                                word ||
                                                label.startsWith(
                                                    `${word} `
                                                )
                                        );


                                    return !ignored;
                                }
                            );


                    if (
                        !availableOptions.length
                    ) {
                        return null;
                    }


                    const randomIndex =
                        Math.floor(
                            Math.random() *
                            availableOptions.length
                        );


                    return availableOptions[
                        randomIndex
                    ];
                };


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


                const fieldType =
                    (
                        metadata.type ||
                        ""
                    ).toLowerCase();


                const fieldTag =
                    (
                        metadata.tag ||
                        ""
                    ).toLowerCase();


                /*
                 * =================================
                 * АВТОМАТИЧЕСКИЙ РЕЖИМ
                 * =================================
                 */
                if (
                    fillMode ===
                    "auto"
                ) {
                    /*
                     * -----------------------------
                     * CHECKBOX
                     * -----------------------------
                     *
                     * Ставим ВСЕ checkbox.
                     */
                    if (
                        fieldType ===
                        "checkbox"
                    ) {
                        try {
                            await field.check({
                                force:
                                    true,
                            });


                            filledFields.push({
                                detectedType:
                                    "checkbox",

                                name:
                                    metadata.name,

                                label:
                                    metadata.label,

                                value:
                                    true,

                                automatic:
                                    true,
                            });
                        } catch {
                            skippedFields.push({
                                detectedType:
                                    "checkbox",

                                name:
                                    metadata.name,

                                reason:
                                    "Не удалось установить checkbox",
                            });
                        }


                        continue;
                    }


                    /*
                     * -----------------------------
                     * SELECT
                     * -----------------------------
                     */
                    if (
                        fieldTag ===
                        "select"
                    ) {
                        const option =
                            getRandomSelectOption(
                                metadata
                            );


                        if (!option) {
                            skippedFields.push({
                                detectedType:
                                    "select",

                                name:
                                    metadata.name,

                                reason:
                                    "Нет подходящего варианта в select",
                            });


                            continue;
                        }


                        try {
                            await field.selectOption({
                                value:
                                    String(
                                        option.value
                                    ),
                            });


                            filledFields.push({
                                detectedType:
                                    "select",

                                name:
                                    metadata.name,

                                value:
                                    option.value,

                                label:
                                    option.label,

                                automatic:
                                    true,
                            });
                        } catch {
                            skippedFields.push({
                                detectedType:
                                    "select",

                                name:
                                    metadata.name,

                                reason:
                                    "Не удалось выбрать вариант",
                            });
                        }


                        continue;
                    }


                    /*
                     * -----------------------------
                     * RADIO
                     * -----------------------------
                     *
                     * Все radio поставить нельзя:
                     * браузер разрешает один вариант
                     * внутри одной группы.
                     *
                     * Поэтому выбираем один случайный.
                     */
                    if (
                        fieldType ===
                        "radio"
                    ) {
                        const groupName =
                            metadata.name ||
                            `radio-${metadata.id ||
                            "anonymous"
                            }`;


                        /*
                         * Эту группу уже выбрали.
                         */
                        if (
                            processedRadioGroups.has(
                                groupName
                            )
                        ) {
                            continue;
                        }


                        processedRadioGroups.add(
                            groupName
                        );


                        const radioFields =
                            candidate.fields
                                .filter(
                                    (
                                        candidateItem
                                    ) => {
                                        const candidateType =
                                            (
                                                candidateItem
                                                    .metadata
                                                    .type ||
                                                ""
                                            ).toLowerCase();


                                        if (
                                            candidateType !==
                                            "radio"
                                        ) {
                                            return false;
                                        }


                                        const candidateName =
                                            candidateItem
                                                .metadata
                                                .name ||
                                            `radio-${candidateItem
                                                .metadata
                                                .id ||
                                            "anonymous"
                                            }`;


                                        return (
                                            candidateName ===
                                            groupName
                                        );
                                    }
                                );


                        if (
                            !radioFields.length
                        ) {
                            continue;
                        }


                        const randomRadio =
                            radioFields[
                            Math.floor(
                                Math.random() *
                                radioFields.length
                            )
                            ];


                        try {
                            await randomRadio
                                .field
                                .check({
                                    force:
                                        true,
                                });


                            filledFields.push({
                                detectedType:
                                    "radio",

                                name:
                                    randomRadio
                                        .metadata
                                        .name,

                                value:
                                    randomRadio
                                        .metadata
                                        .value,

                                automatic:
                                    true,
                            });
                        } catch {
                            skippedFields.push({
                                detectedType:
                                    "radio",

                                name:
                                    metadata.name,

                                reason:
                                    "Не удалось выбрать radio",
                            });
                        }


                        continue;
                    }
                }


                /*
                 * =================================
                 * РУЧНОЙ РЕЖИМ
                 * =================================
                 *
                 * Пока checkbox / radio / select
                 * автоматически не трогаем.
                 */
                if (
                    fillMode ===
                    "manual" &&
                    (
                        fieldType ===
                        "checkbox" ||
                        fieldType ===
                        "radio" ||
                        fieldTag ===
                        "select"
                    )
                ) {
                    skippedFields.push({
                        detectedType:

                            fieldTag ===
                                "select"
                                ? "select"
                                : fieldType,

                        name:
                            metadata.name,

                        reason:
                            "Поле оставлено для ручного выбора",
                    });


                    continue;
                }


                /*
                 * =================================
                 * СТАНДАРТНЫЕ ПОЛЯ
                 * =================================
                 *
                 * Имя, телефон, email,
                 * тема и сообщение.
                 */
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