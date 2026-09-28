import {
    TECHNICAL_FIELD_TYPES,
} from "./constants.js";


export const normalizeText = (
    value = ""
) => {
    return String(value)
        .replace(
            /\s+/g,
            " "
        )
        .trim();
};


export const normalizeHostname = (
    hostname = ""
) => {
    return hostname
        .toLowerCase()
        .replace(
            /^www\./,
            ""
        );
};


export const isTechnicalField = (
    field
) => {
    return TECHNICAL_FIELD_TYPES.includes(
        (
            field.type ||
            ""
        ).toLowerCase()
    );
};


export const detectFieldType = (
    field
) => {
    const text = [
        field.name,
        field.id,
        field.placeholder,
        field.ariaLabel,
        field.autocomplete,
        field.inputMode,
        field.className,
        field.label,
        field.surroundingText,
        field.type,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (
        field.type === "tel" ||
        field.inputMode === "tel" ||
        field.autocomplete ===
        "tel" ||

        text.includes(
            "phone"
        ) ||
        text.includes(
            "telephone"
        ) ||
        text.includes(
            "mobile"
        ) ||

        text.includes(
            "телефон"
        ) ||
        text.includes(
            "тел."
        ) ||
        text.includes(
            "номер телефона"
        ) ||
        text.includes(
            "номер для связи"
        )
    ) {
        return "phone";
    }

    if (
        field.type === "email" ||
        field.autocomplete ===
        "email" ||

        text.includes(
            "email"
        ) ||
        text.includes(
            "e-mail"
        ) ||

        text.includes(
            "почта"
        ) ||
        text.includes(
            "электронная почта"
        )
    ) {
        return "email";
    }

    if (
        field.autocomplete ===
        "name" ||

        text.includes(
            "name"
        ) ||
        text.includes(
            "fullname"
        ) ||
        text.includes(
            "fio"
        ) ||

        text.includes(
            "имя"
        ) ||
        text.includes(
            "фио"
        ) ||
        text.includes(
            "как вас зовут"
        ) ||
        text.includes(
            "как к вам обращаться"
        )
    ) {
        return "name";
    }

    if (
        field.tag ===
        "textarea" ||

        text.includes(
            "message"
        ) ||
        text.includes(
            "comment"
        ) ||
        text.includes(
            "question"
        ) ||
        text.includes(
            "description"
        ) ||

        text.includes(
            "сообщение"
        ) ||
        text.includes(
            "комментар"
        ) ||
        text.includes(
            "вопрос"
        ) ||
        text.includes(
            "напишите"
        ) ||
        text.includes(
            "расскажите"
        )
    ) {
        return "message";
    }

    return "unknown";
};


export const getFieldMetadata =
    async (field) => {
        return field.evaluate(
            (
                element
            ) => {
                const clean = (
                    value
                ) =>
                    (
                        value ||
                        ""
                    )
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();

                let label = "";

                if (element.id) {
                    try {
                        const labelElement =
                            document.querySelector(
                                `label[for="${CSS.escape(
                                    element.id
                                )}"]`
                            );

                        if (
                            labelElement
                        ) {
                            label =
                                clean(
                                    labelElement.textContent
                                );
                        }
                    } catch {
                        //
                    }
                }

                if (!label) {
                    const parentLabel =
                        element.closest(
                            "label"
                        );

                    if (
                        parentLabel
                    ) {
                        label =
                            clean(
                                parentLabel.textContent
                            );
                    }
                }

                const wrapper =
                    element.closest(`
                        .field,
                        .form-field,
                        .input,
                        .input-group,
                        .form-group,
                        .control,

                        [class*="field"],
                        [class*="input"],
                        [class*="control"]
                    `) ||
                    element.parentElement;

                const surroundingText =
                    wrapper
                        ? clean(
                            wrapper.textContent
                        ).slice(
                            0,
                            250
                        )
                        : "";

                const modal =
                    element.closest(`
                        [role="dialog"],
                        [aria-modal="true"],

                        .modal,
                        .popup,
                        .dialog,
                        .callback,
                        .feedback,

                        [class*="modal"],
                        [class*="popup"],
                        [class*="dialog"],
                        [class*="callback"]
                    `);

                return {
                    tag:
                        element.tagName
                            .toLowerCase(),

                    type:
                        element.getAttribute(
                            "type"
                        ) ||
                        (
                            element.getAttribute(
                                "contenteditable"
                            ) ===
                            "true"
                                ? "contenteditable"
                                : ""
                        ),

                    name:
                        element.getAttribute(
                            "name"
                        ) || "",

                    id:
                        element.getAttribute(
                            "id"
                        ) || "",

                    placeholder:
                        element.getAttribute(
                            "placeholder"
                        ) || "",

                    ariaLabel:
                        element.getAttribute(
                            "aria-label"
                        ) || "",

                    autocomplete:
                        element.getAttribute(
                            "autocomplete"
                        ) || "",

                    inputMode:
                        element.getAttribute(
                            "inputmode"
                        ) || "",

                    className:
                        typeof element.className ===
                        "string"
                            ? element.className
                            : "",

                    label,

                    surroundingText,

                    disabled:
                        element.disabled ===
                        true,

                    readOnly:
                        element.readOnly ===
                        true,

                    inModal:
                        Boolean(
                            modal
                        ),
                };
            }
        );
    };


export const findBestFieldGroupAnywhere =
    async (page) => {
        const candidates = [];

        for (
            const frame of
            page.frames()
            ) {
            try {
                const fields =
                    frame.locator(`
                        input,
                        textarea,
                        select,
                        [contenteditable="true"]
                    `);

                const count =
                    await fields.count();

                const visibleFields =
                    [];

                for (
                    let index = 0;
                    index <
                    count;
                    index++
                ) {
                    const field =
                        fields.nth(
                            index
                        );

                    try {
                        if (
                            !(
                                await field.isVisible()
                            )
                        ) {
                            continue;
                        }

                        const metadata =
                            await getFieldMetadata(
                                field
                            );

                        if (
                            metadata.disabled ||
                            metadata.readOnly
                        ) {
                            continue;
                        }

                        if (
                            [
                                "hidden",
                                "submit",
                                "button",
                                "reset",
                                "file",
                            ].includes(
                                metadata.type
                            )
                        ) {
                            continue;
                        }

                        visibleFields.push({
                            field,

                            metadata,

                            detectedType:
                                detectFieldType(
                                    metadata
                                ),
                        });
                    } catch {
                        //
                    }
                }

                if (
                    !visibleFields.length
                ) {
                    continue;
                }

                const modalFields =
                    visibleFields.filter(
                        (
                            item
                        ) =>
                            item.metadata
                                .inModal
                    );

                const targetFields =
                    modalFields.length
                        ? modalFields
                        : visibleFields;

                const types =
                    targetFields.map(
                        (
                            item
                        ) =>
                            item.detectedType
                    );

                let score = 0;

                if (
                    types.includes(
                        "phone"
                    )
                ) {
                    score += 50;
                }

                if (
                    types.includes(
                        "name"
                    )
                ) {
                    score += 25;
                }

                if (
                    types.includes(
                        "message"
                    )
                ) {
                    score += 20;
                }

                if (
                    types.includes(
                        "email"
                    )
                ) {
                    score += 10;
                }

                if (
                    targetFields.length >=
                    2
                ) {
                    score += 15;
                }

                if (
                    modalFields.length
                ) {
                    score += 50;
                }

                if (
                    frame !==
                    page.mainFrame()
                ) {
                    score += 15;
                }

                candidates.push({
                    frame,

                    frameUrl:
                        frame.url(),

                    fields:
                    targetFields,

                    score,

                    isModal:
                        modalFields.length >
                        0,
                });
            } catch {
                //
            }
        }

        if (
            !candidates.length
        ) {
            return null;
        }

        candidates.sort(
            (a, b) =>
                b.score -
                a.score
        );

        return candidates[0];
    };


export const waitForFieldGroup =
    async (
        page,
        timeout = 8000
    ) => {
        const startedAt =
            Date.now();

        while (
            Date.now() -
            startedAt <
            timeout
            ) {
            const candidate =
                await findBestFieldGroupAnywhere(
                    page
                );

            if (
                candidate?.fields
                    ?.length
            ) {
                return candidate;
            }

            await page.waitForTimeout(
                500
            );
        }

        return null;
    };


export const prepareCandidateFields = (
    candidate
) => {
    const types =
        candidate.fields.map(
            (
                item
            ) =>
                item.detectedType
        );

    const hasName =
        types.includes(
            "name"
        );

    const hasPhone =
        types.includes(
            "phone"
        );

    const unknownTexts =
        candidate.fields.filter(
            (
                item
            ) =>
                item.detectedType ===
                "unknown" &&
                [
                    "",
                    "text",
                ].includes(
                    item.metadata.type
                )
        );

    if (
        hasPhone &&
        !hasName &&
        unknownTexts.length
    ) {
        unknownTexts[0]
            .detectedType =
            "name";
    }

    for (
        const item of
        candidate.fields
        ) {
        if (
            item.detectedType ===
            "unknown" &&
            item.metadata.tag ===
            "textarea"
        ) {
            item.detectedType =
                "message";
        }
    }

    return candidate;
};


export const fillFieldSafely =
    async (
        field,
        value,
        metadata
    ) => {
        if (!value) {
            return false;
        }

        if (
            !(
                await field.isVisible()
            )
        ) {
            return false;
        }

        if (
            metadata.disabled ||
            metadata.readOnly
        ) {
            return false;
        }

        let finalValue =
            String(
                value
            );

        if (
            metadata.type ===
            "number"
        ) {
            finalValue =
                finalValue.replace(
                    /\D/g,
                    ""
                );
        }

        if (
            metadata.type ===
            "contenteditable"
        ) {
            try {
                await field.fill(
                    finalValue
                );

                return true;
            } catch {
                try {
                    await field.click();

                    await field.pressSequentially(
                        finalValue,
                        {
                            delay:
                                30,
                        }
                    );

                    return true;
                } catch {
                    return false;
                }
            }
        }

        try {
            await field.fill(
                finalValue
            );

            await field
                .dispatchEvent(
                    "input"
                )
                .catch(
                    () => {}
                );

            await field
                .dispatchEvent(
                    "change"
                )
                .catch(
                    () => {}
                );

            const value =
                await field
                    .inputValue()
                    .catch(
                        () => ""
                    );

            if (value) {
                return true;
            }
        } catch {
            //
        }

        try {
            await field.click();

            await field
                .press(
                    "Control+A"
                )
                .catch(
                    () => {}
                );

            await field
                .press(
                    "Backspace"
                )
                .catch(
                    () => {}
                );

            await field.pressSequentially(
                finalValue,
                {
                    delay:
                        40,
                }
            );

            return Boolean(
                await field
                    .inputValue()
                    .catch(
                        () => ""
                    )
            );
        } catch {
            return false;
        }
    };