import {
    CONTACT_KEYWORDS,
    FORM_TRIGGER_KEYWORDS,
    MAX_ADDITIONAL_PAGES,
    MAX_FORM_TRIGGERS_PER_PAGE,
} from "./constants.js";

import {
    detectFieldType,
    isTechnicalField,
    normalizeHostname,
    normalizeText,
} from "./fields.js";

import {
    gotoSafely,
} from "./browser.js";


export const scanPageForms =
    async (page) => {
        const pageUrl =
            page.url();

        const pageTitle =
            await page.title();

        return page
            .locator("form")
            .evaluateAll(
                (
                    forms,
                    meta
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


                    const isVisible = (
                        element
                    ) => {
                        const style =
                            getComputedStyle(
                                element
                            );

                        const rect =
                            element
                                .getBoundingClientRect();

                        return (
                            style.display !==
                            "none" &&

                            style.visibility !==
                            "hidden" &&

                            Number(
                                style.opacity
                            ) !== 0 &&

                            rect.width > 0 &&
                            rect.height > 0
                        );
                    };


                    /*
                     * =================================
                     * ИЩЕМ TRIGGER СКРЫТОЙ ФОРМЫ
                     * =================================
                     *
                     * Например:
                     *
                     * <a data-src="#call">
                     *   Оставить заявку
                     * </a>
                     *
                     * <div id="call" style="display:none">
                     *   <form>...</form>
                     * </div>
                     */
                    const findPopupTrigger = (
                        form
                    ) => {
                        let current =
                            form.parentElement;


                        /*
                         * Поднимаемся от form вверх
                         * и ищем ближайший контейнер
                         * с id.
                         */
                        while (
                            current &&
                            current !==
                            document.body
                        ) {
                            if (
                                current.id
                            ) {
                                const target =
                                    `#${CSS.escape(
                                        current.id
                                    )
                                    }`;


                                const selectors = [
                                    `[data-src="${target}"]`,
                                    `[data-target="${target}"]`,
                                    `[data-modal="${target}"]`,
                                    `[data-popup="${target}"]`,
                                    `a[href="${target}"]`,
                                ];


                                for (
                                    const selector of
                                    selectors
                                ) {
                                    let trigger;


                                    try {
                                        trigger =
                                            document
                                                .querySelector(
                                                    selector
                                                );
                                    } catch {
                                        trigger =
                                            null;
                                    }


                                    if (
                                        !trigger
                                    ) {
                                        continue;
                                    }


                                    /*
                                     * Не требуем обязательно
                                     * видимость самого target.
                                     *
                                     * Trigger должен быть
                                     * доступен пользователю.
                                     */
                                    if (
                                        !isVisible(
                                            trigger
                                        )
                                    ) {
                                        continue;
                                    }


                                    let triggerSelector =
                                        "";


                                    if (
                                        trigger.id
                                    ) {
                                        triggerSelector =
                                            `#${CSS.escape(
                                                trigger.id
                                            )}`;
                                    } else if (
                                        trigger.hasAttribute(
                                            "data-fancybox"
                                        ) &&
                                        trigger.getAttribute(
                                            "data-src"
                                        )
                                    ) {
                                        triggerSelector =
                                            `[data-fancybox][data-src=${JSON.stringify(
                                                trigger.getAttribute(
                                                    "data-src"
                                                )
                                            )}]`;
                                    } else if (
                                        trigger.getAttribute(
                                            "data-src"
                                        )
                                    ) {
                                        triggerSelector =
                                            `[data-src=${JSON.stringify(
                                                trigger.getAttribute(
                                                    "data-src"
                                                )
                                            )}]`;
                                    }


                                    return {
                                        text:
                                            clean(
                                                trigger.textContent
                                            ) ||
                                            clean(
                                                trigger.getAttribute(
                                                    "value"
                                                )
                                            ) ||
                                            clean(
                                                trigger.getAttribute(
                                                    "aria-label"
                                                )
                                            ) ||
                                            "Открыть форму",

                                        selector:
                                            triggerSelector,

                                        href:
                                            trigger.getAttribute(
                                                "href"
                                            ) ||
                                            "",

                                        dataSrc:
                                            trigger.getAttribute(
                                                "data-src"
                                            ) ||
                                            target,

                                        dataFancybox:
                                            trigger.hasAttribute(
                                                "data-fancybox"
                                            ),

                                        target,
                                    };
                                }
                            }


                            current =
                                current.parentElement;
                        }


                        return null;
                    };


                    return forms.map(
                        (
                            form,
                            formIndex
                        ) => {
                            const fields =
                                Array.from(
                                    form.querySelectorAll(`
                                        input,
                                        textarea,
                                        select
                                    `)
                                ).map(
                                    (
                                        field,
                                        fieldIndex
                                    ) => {
                                        let label =
                                            "";


                                        if (
                                            field.id
                                        ) {
                                            try {
                                                const labelElement =
                                                    document.querySelector(
                                                        `label[for="${CSS.escape(
                                                            field.id
                                                        )}"]`
                                                    );


                                                if (
                                                    labelElement
                                                ) {
                                                    label =
                                                        clean(
                                                            labelElement
                                                                .textContent
                                                        );
                                                }
                                            } catch {
                                                //
                                            }
                                        }


                                        if (
                                            !label
                                        ) {
                                            const parentLabel =
                                                field.closest(
                                                    "label"
                                                );


                                            if (
                                                parentLabel
                                            ) {
                                                label =
                                                    clean(
                                                        parentLabel
                                                            .textContent
                                                    );
                                            }
                                        }


                                        const wrapper =
                                            field.closest(`
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
                                            field.parentElement;


                                        return {
                                            fieldIndex,

                                            tag:
                                                field.tagName
                                                    .toLowerCase(),

                                            type:
                                                field.getAttribute(
                                                    "type"
                                                ) ||
                                                field.tagName
                                                    .toLowerCase(),

                                            name:
                                                field.getAttribute(
                                                    "name"
                                                ) ||
                                                "",

                                            id:
                                                field.getAttribute(
                                                    "id"
                                                ) ||
                                                "",

                                            placeholder:
                                                field.getAttribute(
                                                    "placeholder"
                                                ) ||
                                                "",

                                            ariaLabel:
                                                field.getAttribute(
                                                    "aria-label"
                                                ) ||
                                                "",

                                            autocomplete:
                                                field.getAttribute(
                                                    "autocomplete"
                                                ) ||
                                                "",

                                            inputMode:
                                                field.getAttribute(
                                                    "inputmode"
                                                ) ||
                                                "",

                                            className:
                                                typeof field.className ===
                                                    "string"
                                                    ? field.className
                                                    : "",

                                            label,

                                            surroundingText:
                                                wrapper
                                                    ? clean(
                                                        wrapper
                                                            .textContent
                                                    ).slice(
                                                        0,
                                                        250
                                                    )
                                                    : "",

                                            required:
                                                field.required ===
                                                true,
                                            
                                            checked:
                                                field.checked ===
                                                true,

                                            value:
                                                field.value ||
                                                "",

                                            multiple:
                                                field.multiple ===
                                                true,

                                            options:
                                                field.tagName
                                                    .toLowerCase() ===
                                                    "select"
                                                    ? Array.from(
                                                        field.options ||
                                                        []
                                                    ).map(
                                                        (
                                                            option
                                                        ) => ({
                                                            value:
                                                                option.value,

                                                            label:
                                                                clean(
                                                                    option.textContent
                                                                ),

                                                            selected:
                                                                option.selected ===
                                                                true,

                                                            disabled:
                                                                option.disabled ===
                                                                true,
                                                        })
                                                    )
                                                : [],
                                        };
                                    }
                                );


                            const buttons =
                                Array.from(
                                    form.querySelectorAll(`
                                        button,
                                        input[type="submit"],
                                        input[type="button"]
                                    `)
                                ).map(
                                    (
                                        button
                                    ) => ({
                                        tag:
                                            button.tagName
                                                .toLowerCase(),

                                        type:
                                            button.getAttribute(
                                                "type"
                                            ) ||
                                            "",

                                        text:
                                            clean(
                                                button.textContent
                                            ) ||
                                            button.getAttribute(
                                                "value"
                                            ) ||
                                            "",

                                        disabled:
                                            button.disabled ===
                                            true,
                                    })
                                );


                            const actuallyVisible =
                                isVisible(
                                    form
                                );


                            /*
                             * Если форма скрыта,
                             * проверяем, есть ли
                             * доступная пользователю
                             * кнопка открытия.
                             */
                            const popupTrigger =
                                actuallyVisible
                                    ? null
                                    : findPopupTrigger(
                                        form
                                    );


                            return {
                                formIndex,

                                sourceFormIndex:
                                    formIndex,

                                pageUrl:
                                    meta.pageUrl,

                                pageTitle:
                                    meta.pageTitle,

                                action:
                                    form.getAttribute(
                                        "action"
                                    ) ||
                                    "",

                                method:
                                    form.getAttribute(
                                        "method"
                                    ) ||
                                    "get",


                                /*
                                 * КЛЮЧЕВОЕ ИЗМЕНЕНИЕ.
                                 *
                                 * Если форма скрыта,
                                 * но на неё ведёт
                                 * видимый popup trigger,
                                 * считаем её доступной.
                                 */
                                visible:
                                    actuallyVisible ||
                                    Boolean(
                                        popupTrigger
                                    ),

                                fields,

                                buttons,


                                /*
                                 * Помечаем источник.
                                 */
                                source:
                                    popupTrigger
                                        ? "inline-popup"
                                        : "page",

                                inlineTarget:
                                    popupTrigger
                                        ?.target ||
                                    null,

                                trigger:
                                    popupTrigger
                                        ? {
                                            text:
                                                popupTrigger
                                                    .text,

                                            selector:
                                                popupTrigger
                                                    .selector,

                                            href:
                                                popupTrigger
                                                    .href,

                                            dataSrc:
                                                popupTrigger
                                                    .dataSrc,

                                            dataFancybox:
                                                popupTrigger
                                                    .dataFancybox,
                                        }
                                        : null,
                            };
                        }
                    );
                },
                {
                    pageUrl,
                    pageTitle,
                }
            );
    };


export const createFormSignature = (
    form
) => {
    return [
        form.action,

        form.fields
            .map(
                (
                    field
                ) =>
                    [
                        field.tag,
                        field.type,
                        field.name,
                        field.id,
                        field.placeholder,
                    ].join(":")
            )
            .join("|"),

        (
            form.buttons ||
            []
        )
            .map(
                (
                    button
                ) =>
                    button.text
            )
            .join("|"),
    ].join("::");
};


export const analyzeForm = (
    form
) => {
    const realFields =
        form.fields.filter(
            (
                field
            ) =>
                !isTechnicalField(
                    field
                )
        );

    const types =
        realFields.map(
            (
                field
            ) =>
                detectFieldType(
                    field
                )
        );

    const hasName =
        types.includes(
            "name"
        );

    const hasPhone =
        types.includes(
            "phone"
        );

    const hasEmail =
        types.includes(
            "email"
        );

    const hasSubject =
    types.includes(
        "subject"
    );

    const hasMessage =
        types.includes(
            "message"
        );

    const text = [
        form.action,

        ...realFields.map(
            (
                field
            ) =>
                [
                    field.name,
                    field.id,
                    field.placeholder,
                    field.label,
                    field.surroundingText,
                ].join(" ")
        ),

        ...(
            form.buttons ||
            []
        ).map(
            (
                button
            ) =>
                button.text
        ),
    ]
        .join(" ")
        .toLowerCase();

    let score = 0;

    if (hasPhone) {
        score += 35;
    }

    if (hasName) {
        score += 15;
    }

    if (hasMessage) {
        score += 20;
    }

    if (hasEmail) {
        score += 5;
    }

    if (hasSubject) {
        score += 8;
    }

    if (
        form.buttons?.length
    ) {
        score += 10;
    }

    if (
        form.method
            ?.toLowerCase() ===
        "post"
    ) {
        score += 5;
    }

    if (
        realFields.length >=
        2
    ) {
        score += 5;
    }

    if (
        text.includes("заяв") ||
        text.includes("обратн") ||
        text.includes("перезвон") ||
        text.includes("связ") ||
        text.includes("консультац") ||
        text.includes("callback") ||
        text.includes("feedback") ||
        text.includes("contact")
    ) {
        score += 10;
    }

    const hasCaptcha =
        text.includes(
            "captcha"
        ) ||
        text.includes(
            "recaptcha"
        ) ||
        text.includes(
            "smartcaptcha"
        );

    if (hasCaptcha) {
        score -= 20;
    }

    const searchForm =
        realFields.length ===
        1 &&
        (
            [
                "s",
                "q",
                "search",
            ].includes(
                realFields[0]
                    ?.name
            ) ||

            text.includes(
                "поиск"
            ) ||

            text.includes(
                "search"
            )
        );

    if (searchForm) {
        score -= 50;
    }

    if (
        hasPhone &&
        realFields.length <=
        2
    ) {
        score += 5;
    }

    score =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );

    return {
        realFields,

        technicalFieldsCount:
            form.fields.length -
            realFields.length,

        score,

        relevant:
            score >= 20 &&
            (
                hasPhone ||
                hasEmail ||
                hasMessage
            ),

        hasCaptcha,

        detected: {
            name:
            hasName,

            phone:
            hasPhone,

            email:
            hasEmail,

            subject:
            hasSubject,

            message:
            hasMessage,
        },
    };
};


export const findCandidateLinks =
    async (
        page,
        originalUrl
    ) => {
        const base =
            new URL(
                originalUrl
            );

        const links =
            await page
                .locator(
                    "a[href]"
                )
                .evaluateAll(
                    (
                        elements
                    ) => {
                        const cleanText = (
                            value
                        ) => {
                            return (
                                value ||
                                ""
                            )
                                .replace(
                                    /\s+/g,
                                    " "
                                )
                                .trim();
                        };

                        return elements.map(
                            (
                                element
                            ) => ({
                                href:
                                    element.getAttribute(
                                        "href"
                                    ) || "",

                                text:
                                    cleanText(
                                        element.textContent
                                    ),

                                title:
                                    cleanText(
                                        element.getAttribute(
                                            "title"
                                        )
                                    ),

                                ariaLabel:
                                    cleanText(
                                        element.getAttribute(
                                            "aria-label"
                                        )
                                    ),
                            })
                        );
                    }
                );

        const candidates =
            [];

        for (
            const link of
            links
            ) {
            if (!link.href) {
                continue;
            }

            if (
                link.href.startsWith(
                    "#"
                ) ||
                link.href.startsWith(
                    "tel:"
                ) ||
                link.href.startsWith(
                    "mailto:"
                ) ||
                link.href.startsWith(
                    "javascript:"
                )
            ) {
                continue;
            }

            let targetUrl;

            try {
                targetUrl =
                    new URL(
                        link.href,
                        originalUrl
                    );
            } catch {
                continue;
            }

            if (
                normalizeHostname(
                    targetUrl.hostname
                ) !==
                normalizeHostname(
                    base.hostname
                )
            ) {
                continue;
            }

            targetUrl.hash = "";

            const text =
                [
                    link.text,
                    link.title,
                    link.ariaLabel,
                    targetUrl.pathname,
                ]
                    .join(" ")
                    .toLowerCase();

            let score = 0;

            for (
                const keyword of
                CONTACT_KEYWORDS
                ) {
                if (
                    text.includes(
                        keyword
                    )
                ) {
                    score += 10;
                }
            }

            if (
                /contact|feedback|callback|request/i.test(
                    targetUrl.pathname
                )
            ) {
                score += 10;
            }

            if (!score) {
                continue;
            }

            candidates.push({
                url:
                targetUrl.href,

                text:
                link.text,

                score,
            });
        }

        const unique =
            new Map();

        for (
            const candidate of
            candidates
            ) {
            const existing =
                unique.get(
                    candidate.url
                );

            if (
                !existing ||
                candidate.score >
                existing.score
            ) {
                unique.set(
                    candidate.url,
                    candidate
                );
            }
        }

        return [
            ...unique.values(),
        ]
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            )
            .slice(
                0,
                MAX_ADDITIONAL_PAGES
            );
    };


export const findFormTriggers =
    async (page) => {
        await page
            .waitForSelector(
                "body",
                {
                    timeout:
                        3000,
                }
            )
            .catch(
                () => {}
            );
        await page.waitForTimeout(
            250
        )

        
        const candidates =
            [];


        /*
         * =====================================
         * 1. ОБЫЧНЫЕ КЛИКАБЕЛЬНЫЕ ЭЛЕМЕНТЫ
         * =====================================
         */

        const clickable =
            page.locator(`
                button,
                a,

                input[type="button"],
                input[type="submit"],

                [role="button"],
                [onclick],

                [data-fancybox],
                [data-src],

                [data-h],
                [data-modal],
                [data-popup],
                [data-target],
                [data-toggle],

                [class*="button"],
                [class*="btn"],
                [class*="callback"],
                [class*="feedback"],
                [class*="request"],
                [class*="order"]
            `);


        const clickableCount =
            await clickable.count();


        for (
            let index = 0;
            index <
            clickableCount;
            index++
        ) {
            const locator =
                clickable.nth(
                    index
                );

            try {
                const info =
                    await locator.evaluate(
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


                            const tag =
                                element.tagName
                                    .toLowerCase();


                            const type =
                                (
                                    element.getAttribute(
                                        "type"
                                    ) ||
                                    ""
                                )
                                    .toLowerCase();


                            const href =
                                element.getAttribute(
                                    "href"
                                ) ||
                                "";


                            return {
                                tag,

                                type,

                                href,

                                dataSrc:
                                    clean(
                                        element.getAttribute(
                                            "data-src"
                                        )
                                    ),

                                dataFancybox:
                                    element.hasAttribute(
                                        "data-fancybox"
                                    ),

                                text:
                                    clean(
                                        element.textContent
                                    ),

                                value:
                                    clean(
                                        element.getAttribute(
                                            "value"
                                        )
    ),

                                ariaLabel:
                                    clean(
                                        element.getAttribute(
                                            "aria-label"
                                        )
                                    ),

                                title:
                                    clean(
                                        element.getAttribute(
                                            "title"
                                        )
                                    ),

                                dataH:
                                    clean(
                                        element.getAttribute(
                                            "data-h"
                                        )
                                    ),

                                className:
                                    typeof element.className ===
                                        "string"
                                        ? element.className
                                        : "",

                                onclick:
                                    clean(
                                        element.getAttribute(
                                            "onclick"
                                        )
                                    ),

                                id:
                                    element.id ||
                                    "",

                                inForm:
                                    Boolean(
                                        element.closest(
                                            "form"
                                        )
                                    ),

                                disabled:
                                    element.disabled ===
                                    true,

                                display:
                                getComputedStyle(
                                    element
                                ).display,

                                visibility:
                                getComputedStyle(
                                    element
                                ).visibility,

                                opacity:
                                getComputedStyle(
                                    element
                                ).opacity,
                            };
                        }
                    );


                if (
                    info.inForm ||
                    info.disabled
                ) {
                    continue;
                }


                if (
                    info.href.startsWith(
                        "tel:"
                    ) ||
                    info.href.startsWith(
                        "mailto:"
                    )
                ) {
                    continue;
                }


                /*
                 * Не требуем rect.width/height.
                 *
                 * На некоторых сайтах
                 * кликабельный родитель сам
                 * может иметь нулевой rect,
                 * хотя его дочерний текст виден.
                 */
                if (
                    info.display ===
                    "none" ||
                    info.visibility ===
                    "hidden" ||
                    info.opacity ===
                    "0"
                ) {
                    continue;
                }


                const searchableText =
                    [
                        info.text,
                        info.value,
                        info.ariaLabel,
                        info.title,
                        info.dataH,
                        info.id,
                        info.className,
                        info.onclick,
                    ]
                        .filter(
                            Boolean
                        )
                        .join(
                            " "
                        )
                        .toLowerCase();


                let matchedKeyword =
                    "";

                let score =
                    0;


                for (
                    const keyword of
                    FORM_TRIGGER_KEYWORDS
                    ) {
                    if (
                        searchableText.includes(
                            keyword
                        )
                    ) {
                        const currentScore =
                            30 +
                            keyword.length;

                        if (
                            currentScore >
                            score
                        ) {
                            score =
                                currentScore;

                            matchedKeyword =
                                keyword;
                        }
                    }
                }


                if (!score) {
                    continue;
                }


                if (
                    info.tag ===
                    "button"
                ) {
                    score += 30;
                }


                if (
                    info.tag ===
                    "a"
                ) {
                    score += 20;
                }

                if (
                    info.tag ===
                    "input" &&
                    (
                        info.type ===
                        "button" ||
                        info.type ===
                        "submit"
                    )
                ) {
                    score += 30;
                }

                if (
                    info.dataH
                ) {
                    score += 40;
                }

                if (
                    info.dataFancybox &&
                    info.dataSrc
                        ?.startsWith(
                            "#"
                        )
                ) {
                    score += 100;
                }

                let selector =
                    "";


                if (
                    info.id
                ) {
                    selector =
                        `#${CSS.escape(
                            info.id
                        )}`;
                }

                if (
                    !selector &&
                    info.dataFancybox &&
                    info.dataSrc
                ) {
                    selector =
                        `[data-fancybox][data-src=${JSON.stringify(
                            info.dataSrc
                        )}]`;
                }

                if (
                    !selector &&
                    info.dataH
                ) {
                    selector =
                        `[data-h=${JSON.stringify(
                            info.dataH
                        )}]`;
                }


                candidates.push({
                    text:
                        info.text ||
                        info.value ||
                        info.ariaLabel ||
                        info.title ||
                        info.dataH ||
                        matchedKeyword,

                    keyword:
                    matchedKeyword,

                    selector,

                    tag:
                    info.tag,

                    href:
                    info.href,

                    dataSrc:
                    info.dataSrc,

                    dataFancybox:
                    info.dataFancybox,

                    dataH:
                    info.dataH,

                    score,

                    source:
                        "clickable",
                });
            } catch {
                //
            }
        }


        /*
         * =====================================
         * 2. FALLBACK ПО ТОЧНОМУ ТЕКСТУ
         * =====================================
         *
         * Это НЕ старый fallback:
         * мы не кликаем произвольную другую
         * кнопку.
         *
         * Мы ищем только тот же keyword.
         */

        for (
            const keyword of
            FORM_TRIGGER_KEYWORDS
            ) {
            const matches =
                page.getByText(
                    keyword,
                    {
                        exact:
                            false,
                    }
                );


            const count =
                await matches.count();


            for (
                let index = 0;
                index <
                Math.min(
                    count,
                    10
                );
                index++
            ) {
                const match =
                    matches.nth(
                        index
                    );


                try {
                    const info =
                        await match.evaluate(
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


                                /*
                                 * Ищем ближайший
                                 * реальный кликабельный
                                 * элемент.
                                 */
                                const clickable =
                                    element.closest(`
                                        button,
                                        a,
                                        [role="button"],
                                        [onclick],
                                        [data-h],
                                        [data-modal],
                                        [data-popup],
                                        [data-target],
                                        [data-toggle],

                                        .btn,
                                        .button,

                                        [class*="btn"],
                                        [class*="button"],
                                        [class*="callback"],
                                        [class*="feedback"],
                                        [class*="request"],
                                        [class*="order"]
                                    `) ||
                                    element;

                                if (
                                    clickable.closest(
                                        "form"
                                    )
                                ) {
                                    return null;
                                }


                                const type =
                                    (
                                        clickable.getAttribute(
                                            "type"
                                        ) ||
                                        ""
                                    )
                                        .toLowerCase();


                                if (
                                    type ===
                                    "submit"
                                ) {
                                    return null;
                                }


                                return {
                                    text:
                                        clean(
                                            clickable.textContent
                                        ) ||
                                        clean(
                                            element.textContent
                                        ),

                                    tag:
                                        clickable.tagName
                                            .toLowerCase(),

                                    href:
                                        clickable.getAttribute(
                                            "href"
                                        ) ||
                                        "",

                                    id:
                                        clickable.id ||
                                        "",

                                    dataH:
                                        clean(
                                            clickable.getAttribute(
                                                "data-h"
                                            )
                                        ),
                                };
                            }
                        );


                    if (!info) {
                        continue;
                    }


                    if (
                        info.href.startsWith(
                            "tel:"
                        ) ||
                        info.href.startsWith(
                            "mailto:"
                        )
                    ) {
                        continue;
                    }


                    let selector =
                        "";


                    if (
                        info.id
                    ) {
                        selector =
                            `#${CSS.escape(
                                info.id
                            )}`;
                    }


                    if (
                        !selector &&
                        info.dataH
                    ) {
                        selector =
                            `[data-h=${JSON.stringify(
                                info.dataH
                            )}]`;
                    }


                    candidates.push({
                        text:
                            info.text ||
                            keyword,

                        keyword,

                        selector,

                        tag:
                        info.tag,

                        href:
                        info.href,

                        dataH:
                        info.dataH,

                        score:
                            60 +
                            keyword.length,

                        source:
                            "text",
                    });
                } catch {
                    //
                }
            }
        }


        /*
         * =====================================
         * УБИРАЕМ ДУБЛИ
         * =====================================
         */

        const unique =
            new Map();


        for (
            const trigger of
            candidates
            ) {
            const key =
                trigger.selector ||
                [
                    trigger.keyword,
                    trigger.text,
                    trigger.tag,
                ]
                    .join(
                        "|"
                    )
                    .toLowerCase();


            const current =
                unique.get(
                    key
                );


            if (
                !current ||
                trigger.score >
                current.score
            ) {
                unique.set(
                    key,
                    trigger
                );
            }
        }


        const triggers =
            [
                ...unique.values(),
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.score -
                        a.score
                )
                .slice(
                    0,
                    MAX_FORM_TRIGGERS_PER_PAGE
                );


        return triggers;
    };


const getInteractionState =
    async (page) => {
        let visibleFields =
            0;

        let visibleDialogs =
            0;

        const frames =
            page.frames();

        for (
            const frame of
            frames
        ) {
            try {
                visibleFields +=
                    await frame
                        .locator(`
                            input:visible,
                            textarea:visible,
                            select:visible,
                            [contenteditable="true"]:visible
                        `)
                        .count()
                        .catch(
                            () => 0
                        );


                visibleDialogs +=
                    await frame
                        .locator(`
                            [role="dialog"]:visible,
                            [aria-modal="true"]:visible,

                            .modal:visible,
                            .popup:visible,
                            .dialog:visible,
                            .callback:visible,
                            .feedback:visible,

                            [class*="modal"]:visible,
                            [class*="popup"]:visible,
                            [class*="dialog"]:visible,
                            [class*="callback"]:visible,
                            [class*="feedback"]:visible
                        `)
                        .count()
                        .catch(
                            () => 0
                        );
            } catch {
                //
            }
        }


        return {
            url:
                page.url(),

            visibleFields,

            visibleDialogs,

            framesCount:
                frames.length,

            pagesCount:
                page.context()
                    .pages()
                    .length,
        };
    };


const clickAndVerifyTrigger =
    async (
        page,
        locator
    ) => {
        try {
            const visible =
                await locator
                    .isVisible()
                    .catch(
                        () => false
                    );

            if (!visible) {
                return false;
            }


            const safe =
                await locator
                    .evaluate(
                        (
                            element
                        ) => {
                            if (
                                element.closest(
                                    "form"
                                )
                            ) {
                                return false;
                            }

                            return true;
                        }
                    )
                    .catch(
                        () => false
                    );


            if (!safe) {
                return false;
            }


            const before =
                await getInteractionState(
                    page
                );
            let clicked =
                false;


            try {
                await locator.click({
                    timeout:
                        2500,
                });

                clicked =
                    true;
            } catch {
                try {
                    await locator.click({
                        force:
                            true,

                        timeout:
                            1500,
                    });

                    clicked =
                        true;
                } catch {
                    //
                }
            }


            if (!clicked) {
                return false;
            }

            for (
                let attempt = 0;
                attempt < 15;
                attempt++
            ) {
                await page.waitForTimeout(
                    120
                );


                const after =
                    await getInteractionState(
                        page
                    );


                const changed =
                    (
                        after.pagesCount >
                        before.pagesCount ||

                        after.visibleFields >
                        before.visibleFields ||

                        after.visibleDialogs >
                        before.visibleDialogs ||

                        after.url !==
                        before.url
                    );


                if (changed) {
                    return true;
                }
            }


            return false;
        } catch {
            return false;
        }
    };

const clickAndVerifyFancyboxTrigger =
    async (
        page,
        locator,
        targetSelector
    ) => {
        try {
            if (
                !(
                    await locator
                        .isVisible()
                        .catch(
                            () => false
                        )
                )
            ) {
                return false;
            }


            const target =
                targetSelector
                    ? page.locator(
                        targetSelector
                    )
                    : null;


            const targetWasVisible =
                target
                    ? await target
                        .isVisible()
                        .catch(
                            () => false
                        )
                    : false;


            const fancyboxBefore =
                await page
                    .locator(`
                        .fancybox-container:visible,
                        .fancybox-content:visible,
                        .fancybox-slide:visible
                    `)
                    .count()
                    .catch(
                        () => 0
                    );


            /*
             * Нормальный пользовательский click.
             */
            try {
                await locator.click({
                    timeout:
                        3000,
                });
            } catch {
                /*
                 * На случай overlay.
                 */
                try {
                    await locator.click({
                        force:
                            true,

                        timeout:
                            2000,
                    });
                } catch {
                    return false;
                }
            }


            /*
             * Fancybox обычно появляется
             * очень быстро.
             */
            for (
                let attempt = 0;
                attempt < 20;
                attempt++
            ) {
                await page.waitForTimeout(
                    100
                );


                /*
                 * Вариант №1:
                 * сам #call стал видимым.
                 */
                if (target) {
                    const targetVisible =
                        await target
                            .isVisible()
                            .catch(
                                () => false
                            );

                    if (
                        targetVisible &&
                        !targetWasVisible
                    ) {
                        return true;
                    }
                }


                /*
                 * Вариант №2:
                 * Fancybox создал свой
                 * контейнер.
                 */
                const fancyboxAfter =
                    await page
                        .locator(`
                            .fancybox-container:visible,
                            .fancybox-content:visible,
                            .fancybox-slide:visible
                        `)
                        .count()
                        .catch(
                            () => 0
                        );


                if (
                    fancyboxAfter >
                    fancyboxBefore
                ) {
                    return true;
                }


                /*
                 * Вариант №3:
                 * в Fancybox появились поля.
                 */
                const fancyboxFields =
                    await page
                        .locator(`
                            .fancybox-container:visible input:visible,
                            .fancybox-container:visible textarea:visible,
                            .fancybox-container:visible select:visible,

                            .fancybox-content:visible input:visible,
                            .fancybox-content:visible textarea:visible,
                            .fancybox-content:visible select:visible
                        `)
                        .count()
                        .catch(
                            () => 0
                        );


                if (
                    fancyboxFields >
                    0
                ) {
                    return true;
                }
            }


            return false;
        } catch {
            return false;
        }
    };

export const openFormTrigger =
    async (
        page,
        trigger
    ) => {
        const text =
            normalizeText(
                trigger?.text ||
                trigger?.keyword ||
                ""
            );

        if (
            trigger?.dataFancybox &&
            trigger?.dataSrc
                ?.startsWith(
                    "#"
                )
        ) {
            const fancyboxTrigger =
                page
                    .locator(
                        `[data-fancybox][data-src=${JSON.stringify(
                            trigger.dataSrc
                        )}]`
                    )
                    .filter({
                        hasText:
                            text ||
                            undefined,
                    })
                    .first();


            if (
                await fancyboxTrigger
                    .count()
                    .catch(
                        () => 0
                    )
            ) {
                const opened =
                    await clickAndVerifyFancyboxTrigger(
                        page,
                        fancyboxTrigger,
                        trigger.dataSrc
                    );


                if (opened) {
                    return true;
                }
            }
        }

        /*
         * =====================================
         * 1. ТОЧНЫЙ CSS SELECTOR
         * =====================================
         */
        if (
            trigger?.selector
        ) {
            const locator =
                page
                    .locator(
                        trigger.selector
                    )
                    .first();


            if (
                await clickAndVerifyTrigger(
                    page,
                    locator
                )
            ) {
                return true;
            }
        }


        /*
         * =====================================
         * 2. ACCESSIBILITY ROLE
         * =====================================
         */
        if (text) {
            for (
                const role of
                [
                    "button",
                    "link",
                ]
            ) {
                const locator =
                    page.getByRole(
                        role,
                        {
                            name:
                                text,

                            exact:
                                false,
                        }
                    );


                const count =
                    await locator.count();


                for (
                    let index = 0;
                    index <
                    Math.min(
                        count,
                        8
                    );
                    index++
                ) {
                    if (
                        await clickAndVerifyTrigger(
                            page,
                            locator.nth(
                                index
                            )
                        )
                    ) {
                        return true;
                    }
                }
            }
        }


        /*
         * =====================================
         * 3. INPUT VALUE
         * =====================================
         *
         * getByText не видит:
         *
         * <input value="Оставить заявку">
         */
        if (text) {
            const inputs =
                page.locator(`
                    input[type="button"],
                    input[type="submit"]
                `);


            const count =
                await inputs.count();


            for (
                let index = 0;
                index <
                Math.min(
                    count,
                    20
                );
                index++
            ) {
                const input =
                    inputs.nth(
                        index
                    );


                const value =
                    normalizeText(
                        await input
                            .getAttribute(
                                "value"
                            )
                            .catch(
                                () => ""
                            )
                    );


                if (
                    !value ||
                    !value
                        .toLowerCase()
                        .includes(
                            text.toLowerCase()
                        )
                ) {
                    continue;
                }


                if (
                    await clickAndVerifyTrigger(
                        page,
                        input
                    )
                ) {
                    return true;
                }
            }
        }


        /*
         * =====================================
         * 4. ТОЧНЫЙ ТЕКСТ
         * =====================================
         */
        if (text) {
            const locator =
                page.getByText(
                    text,
                    {
                        exact:
                            true,
                    }
                );


            const count =
                await locator.count();


            for (
                let index = 0;
                index <
                Math.min(
                    count,
                    10
                );
                index++
            ) {
                if (
                    await clickAndVerifyTrigger(
                        page,
                        locator.nth(
                            index
                        )
                    )
                ) {
                    return true;
                }
            }
        }


        /*
         * =====================================
         * 5. НЕТОЧНОЕ СОВПАДЕНИЕ
         * =====================================
         *
         * Для вложенных span/div:
         *
         * <div class="callback">
         *   <span>Оставить заявку</span>
         * </div>
         */
        if (text) {
            const locator =
                page.getByText(
                    text,
                    {
                        exact:
                            false,
                    }
                );


            const count =
                await locator.count();


            for (
                let index = 0;
                index <
                Math.min(
                    count,
                    15
                );
                index++
            ) {
                if (
                    await clickAndVerifyTrigger(
                        page,
                        locator.nth(
                            index
                        )
                    )
                ) {
                    return true;
                }
            }
        }


        return false;
    };

const scanVisibleFields =
    async (page) => {
        const result = [];

        const frames =
            page.frames();

        for (
            let frameIndex = 0;
            frameIndex < frames.length;
            frameIndex++
        ) {
            const frame =
                frames[
                    frameIndex
                    ];

            try {
                const fields =
                    await frame
                        .locator(`
                            input,
                            textarea,
                            select
                        `)
                        .evaluateAll(
                            (
                                elements,
                                frameIndex
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


                                const isVisible = (
                                    element
                                ) => {
                                    const style =
                                        window.getComputedStyle(
                                            element
                                        );

                                    const rect =
                                        element.getBoundingClientRect();

                                    return (
                                        style.display !==
                                        "none" &&

                                        style.visibility !==
                                        "hidden" &&

                                        Number(
                                            style.opacity
                                        ) !== 0 &&

                                        rect.width >
                                        0 &&

                                        rect.height >
                                        0
                                    );
                                };


                                const getDomPath = (
                                    element
                                ) => {
                                    const parts =
                                        [];

                                    let current =
                                        element;

                                    while (
                                        current &&
                                        current !==
                                        document.body &&
                                        parts.length <
                                        8
                                        ) {
                                        let part =
                                            current
                                                .tagName
                                                .toLowerCase();

                                        if (
                                            current.id
                                        ) {
                                            part +=
                                                `#${CSS.escape(
                                                    current.id
                                                )}`;

                                            parts.unshift(
                                                part
                                            );

                                            break;
                                        }

                                        const parent =
                                            current.parentElement;

                                        if (
                                            parent
                                        ) {
                                            const sameTag =
                                                [
                                                    ...parent.children,
                                                ].filter(
                                                    (
                                                        child
                                                    ) =>
                                                        child.tagName ===
                                                        current.tagName
                                                );

                                            if (
                                                sameTag.length >
                                                1
                                            ) {
                                                part +=
                                                    `:nth-of-type(${
                                                        sameTag.indexOf(
                                                            current
                                                        ) +
                                                        1
                                                    })`;
                                            }
                                        }

                                        parts.unshift(
                                            part
                                        );

                                        current =
                                            parent;
                                    }

                                    return (
                                        `${frameIndex}:` +
                                        parts.join(
                                            ">"
                                        )
                                    );
                                };


                                return elements
                                    .filter(
                                        (
                                            element
                                        ) =>
                                            isVisible(
                                                element
                                            )
                                    )
                                    .filter(
                                        (
                                            element
                                        ) => {
                                            const type =
                                                (
                                                    element.getAttribute(
                                                        "type"
                                                    ) ||
                                                    ""
                                                ).toLowerCase();

                                            return ![
                                                "hidden",
                                                "submit",
                                                "button",
                                                "reset",
                                                "image",
                                                "file",
                                            ].includes(
                                                type
                                            );
                                        }
                                    )
                                    .map(
                                        (
                                            element
                                        ) => {
                                            let label =
                                                "";

                                            if (
                                                element.id
                                            ) {
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


                                            if (
                                                !label
                                            ) {
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


                                            return {
                                                domPath:
                                                    getDomPath(
                                                        element
                                                    ),

                                                tag:
                                                    element.tagName
                                                        .toLowerCase(),

                                                type:
                                                    element.getAttribute(
                                                        "type"
                                                    ) ||
                                                    element.tagName
                                                        .toLowerCase(),

                                                name:
                                                    element.getAttribute(
                                                        "name"
                                                    ) ||
                                                    "",

                                                id:
                                                    element.getAttribute(
                                                        "id"
                                                    ) ||
                                                    "",

                                                placeholder:
                                                    element.getAttribute(
                                                        "placeholder"
                                                    ) ||
                                                    "",

                                                ariaLabel:
                                                    element.getAttribute(
                                                        "aria-label"
                                                    ) ||
                                                    "",

                                                autocomplete:
                                                    element.getAttribute(
                                                        "autocomplete"
                                                    ) ||
                                                    "",

                                                inputMode:
                                                    element.getAttribute(
                                                        "inputmode"
                                                    ) ||
                                                    "",

                                                className:
                                                    typeof element.className ===
                                                    "string"
                                                        ? element.className
                                                        : "",

                                                label,

                                                surroundingText:
                                                    wrapper
                                                        ? clean(
                                                            wrapper.textContent
                                                        ).slice(
                                                            0,
                                                            250
                                                        )
                                                        : "",

                                                required:
                                                    element.required ===
                                                    true,
                                            };
                                        }
                                    );
                            },
                            frameIndex
                        );


                result.push(
                    ...fields
                );
            } catch {
                //
            }
        }


        return result;
    };

export const scanInlinePopupForms =
    async (page) => {
        const pageUrl =
            page.url();

        const pageTitle =
            await page.title();


        return page.evaluate(
            (
                {
                    pageUrl,
                    pageTitle,
                    keywords,
                }
            ) => {
                const clean = (
                    value
                ) =>
                    String(
                        value || ""
                    )
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim();


                const allPageForms =
                    [
                        ...document.querySelectorAll(
                            "form"
                        ),
                    ];


                const createField =
                    (
                        field,
                        fieldIndex
                    ) => {
                        let label =
                            "";


                        if (field.id) {
                            try {
                                const labelElement =
                                    document.querySelector(
                                        `label[for="${CSS.escape(
                                            field.id
                                        )}"]`
                                    );


                                if (labelElement) {
                                    label =
                                        clean(
                                            labelElement
                                                .textContent
                                        );
                                }
                            } catch {
                                //
                            }
                        }


                        if (!label) {
                            const parentLabel =
                                field.closest(
                                    "label"
                                );


                            if (parentLabel) {
                                label =
                                    clean(
                                        parentLabel
                                            .textContent
                                    );
                            }
                        }


                        const wrapper =
                            field.closest(`
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
                            field.parentElement;


                        return {
                            fieldIndex,

                            tag:
                                field.tagName
                                    .toLowerCase(),

                            type:
                                field.getAttribute(
                                    "type"
                                ) ||
                                field.tagName
                                    .toLowerCase(),

                            name:
                                field.getAttribute(
                                    "name"
                                ) || "",

                            id:
                                field.getAttribute(
                                    "id"
                                ) || "",

                            placeholder:
                                field.getAttribute(
                                    "placeholder"
                                ) || "",

                            ariaLabel:
                                field.getAttribute(
                                    "aria-label"
                                ) || "",

                            autocomplete:
                                field.getAttribute(
                                    "autocomplete"
                                ) || "",

                            inputMode:
                                field.getAttribute(
                                    "inputmode"
                                ) || "",

                            className:
                                typeof field.className ===
                                "string"
                                    ? field.className
                                    : "",

                            label,

                            surroundingText:
                                wrapper
                                    ? clean(
                                        wrapper
                                            .textContent
                                    ).slice(
                                        0,
                                        250
                                    )
                                    : "",

                            required:
                                field.required ===
                                true,
                            checked:
                                field.checked ===
                                true,

                            value:
                                field.value ||
                                "",

                            multiple:
                                field.multiple ===
                                true,

                            options:
                                field.tagName
                                    .toLowerCase() ===
                                    "select"
                                    ? Array.from(
                                        field.options ||
                                        []
                                    ).map(
                                        (
                                            option
                                        ) => ({
                                            value:
                                                option.value,

                                            label:
                                                clean(
                                                    option.textContent
                                                ),

                                            selected:
                                                option.selected ===
                                                true,

                                            disabled:
                                                option.disabled ===
                                                true,
                                        })
                                    )
                                : [],
                        };
                    };


                const createButtons =
                    (form) =>
                        [
                            ...form.querySelectorAll(`
                                button,
                                input[type="submit"],
                                input[type="button"]
                            `),
                        ].map(
                            (
                                button
                            ) => ({
                                tag:
                                    button.tagName
                                        .toLowerCase(),

                                type:
                                    button.getAttribute(
                                        "type"
                                    ) || "",

                                text:
                                    clean(
                                        button.textContent
                                    ) ||
                                    clean(
                                        button.getAttribute(
                                            "value"
                                        )
                                    ),

                                disabled:
                                    button.disabled ===
                                    true,
                            })
                        );


                const triggers =
                    [
                        ...document.querySelectorAll(`
                            [data-src^="#"],
                            [data-target^="#"],
                            [data-modal^="#"],
                            [data-popup^="#"]
                        `),
                    ];


                const results =
                    [];


                for (
                    const trigger of
                    dynamicTriggers
                ) {
                    const triggerText =
                        clean(
                            trigger.textContent
                        ) ||
                        clean(
                            trigger.getAttribute(
                                "value"
                            )
                        ) ||
                        clean(
                            trigger.getAttribute(
                                "aria-label"
                            )
                        );


                    const searchable =
                        [
                            triggerText,

                            trigger.getAttribute(
                                "title"
                            ),

                            trigger.getAttribute(
                                "class"
                            ),

                            trigger.getAttribute(
                                "data-src"
                            ),

                            trigger.getAttribute(
                                "data-target"
                            ),
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            )
                            .toLowerCase();


                    /*
                     * Не берём любой #target.
                     *
                     * CTA должен быть похож
                     * именно на заявку /
                     * обратную связь.
                     */
                    const matchedKeyword =
                        keywords.find(
                            (
                                keyword
                            ) =>
                                searchable.includes(
                                    keyword
                                )
                        );


                    if (!matchedKeyword) {
                        continue;
                    }


                    const targetSelector =
                        trigger.getAttribute(
                            "data-src"
                        ) ||
                        trigger.getAttribute(
                            "data-target"
                        ) ||
                        trigger.getAttribute(
                            "data-modal"
                        ) ||
                        trigger.getAttribute(
                            "data-popup"
                        );


                    if (
                        !targetSelector ||
                        !targetSelector
                            .startsWith(
                                "#"
                            )
                    ) {
                        continue;
                    }


                    let target;


                    try {
                        target =
                            document.querySelector(
                                targetSelector
                            );
                    } catch {
                        continue;
                    }


                    if (!target) {
                        continue;
                    }


                    /*
                     * Точный selector trigger.
                     */
                    let triggerSelector =
                        "";


                    if (trigger.id) {
                        triggerSelector =
                            `#${CSS.escape(
                                trigger.id
                            )}`;
                    } else if (
                        trigger.hasAttribute(
                            "data-fancybox"
                        )
                    ) {
                        triggerSelector =
                            `[data-fancybox][data-src=${JSON.stringify(
                                targetSelector
                            )}]`;
                    } else {
                        triggerSelector =
                            `[data-src=${JSON.stringify(
                                targetSelector
                            )}]`;
                    }


                    /*
                     * =================================
                     * НАСТОЯЩИЕ <form>
                     * =================================
                     */

                    const targetForms =
                        target.matches(
                            "form"
                        )
                            ? [
                                target,
                            ]
                            : [
                                ...target.querySelectorAll(
                                    "form"
                                ),
                            ];


                    for (
                        const form of
                        targetForms
                    ) {
                        const sourceFormIndex =
                            allPageForms.indexOf(
                                form
                            );


                        const fields =
                            [
                                ...form.querySelectorAll(`
                                    input,
                                    textarea,
                                    select
                                `),
                            ].map(
                                (
                                    field,
                                    fieldIndex
                                ) =>
                                    createField(
                                        field,
                                        fieldIndex
                                    )
                            );


                        if (!fields.length) {
                            continue;
                        }


                        results.push({
                            formIndex:
                                sourceFormIndex,

                            sourceFormIndex,

                            pageUrl,

                            pageTitle,

                            action:
                                form.getAttribute(
                                    "action"
                                ) || "",

                            method:
                                form.getAttribute(
                                    "method"
                                ) || "get",

                            /*
                             * В DOM форма скрыта,
                             * но это нормально:
                             * trigger предназначен
                             * именно для её открытия.
                             */
                            visible:
                                true,

                            fields,

                            buttons:
                                createButtons(
                                    form
                                ),

                            source:
                                "inline-popup",

                            synthetic:
                                false,

                            inlineTarget:
                                targetSelector,

                            trigger: {
                                text:
                                    triggerText ||
                                    matchedKeyword,

                                keyword:
                                    matchedKeyword,

                                selector:
                                    triggerSelector,

                                href:
                                    trigger.getAttribute(
                                        "href"
                                    ) || "",

                                dataSrc:
                                    targetSelector,

                                dataFancybox:
                                    trigger.hasAttribute(
                                        "data-fancybox"
                                    ),
                            },
                        });
                    }


                    /*
                     * =================================
                     * POPUP БЕЗ <form>
                     * =================================
                     *
                     * Иногда внутри #target лежат
                     * просто input'ы.
                     */

                    if (!targetForms.length) {
                        const rawFields =
                            [
                                ...target.querySelectorAll(`
                                    input,
                                    textarea,
                                    select
                                `),
                            ];


                        if (
                            rawFields.length
                        ) {
                            results.push({
                                formIndex:
                                    -1,

                                sourceFormIndex:
                                    null,

                                pageUrl,

                                pageTitle,

                                action:
                                    "",

                                method:
                                    "unknown",

                                visible:
                                    true,

                                fields:
                                    rawFields.map(
                                        (
                                            field,
                                            fieldIndex
                                        ) =>
                                            createField(
                                                field,
                                                fieldIndex
                                            )
                                    ),

                                buttons:
                                    [],

                                source:
                                    "inline-popup",

                                synthetic:
                                    true,

                                inlineTarget:
                                    targetSelector,

                                trigger: {
                                    text:
                                        triggerText ||
                                        matchedKeyword,

                                    keyword:
                                        matchedKeyword,

                                    selector:
                                        triggerSelector,

                                    href:
                                        trigger.getAttribute(
                                            "href"
                                        ) || "",

                                    dataSrc:
                                        targetSelector,

                                    dataFancybox:
                                        trigger.hasAttribute(
                                            "data-fancybox"
                                        ),
                                },
                            });
                        }
                    }
                }


                return results;
            },
            {
                pageUrl,
                pageTitle,

                keywords:
                    FORM_TRIGGER_KEYWORDS,
            }
        );
    };

export const scanPopupForms =
    async (
        page,
        pageUrl,
        options = {}
    ) => {
        const {
            skipInitialNavigation =
                false,
        } =
            options;

        const forms = [];

        const inlineForms =
            await scanInlinePopupForms(
                page
            )
                .catch(
                    () => []
                );


        if (
            inlineForms.length
        ) {
            forms.push(
                ...inlineForms
            );
        }


        /*
         * Если вызывающий код уже находится
         * на нужной странице, повторно
         * загружать её совершенно незачем.
         */
        if (
            !skipInitialNavigation ||
            page.url() !==
            pageUrl
        ) {
    
        if (
            page.url() !==
            pageUrl
        ) {
            await gotoSafely(
                page,
                pageUrl,
                {
                    attempts:
                        2,

                    timeout:
                        18000,

                    settleDelay:
                        300,
                }
            );
        }       
            const [
                beforeForms,
                beforeFields,
            ] =
                await Promise.all([
                    scanPageForms(
                        page
                    ),

                    scanVisibleFields(
                        page
                    ),
                ]);
        }


        const triggers =
            await findFormTriggers(
                page
            );

        const knownInlineTargets =
            new Set(
                inlineForms
                    .map(
                        (
                            form
                        ) =>
                            form.inlineTarget
                    )
                    .filter(
                        Boolean
                    )
            );


        const dynamicTriggers =
            triggers.filter(
                (
                    trigger
                ) =>
                    !trigger.dataSrc ||
                    !knownInlineTargets.has(
                        trigger.dataSrc
                    )
            );

        for (
            let triggerIndex = 0;
            triggerIndex <
            triggers.length;
            triggerIndex++
        ) {
            const trigger =
                triggers[
                    triggerIndex
            ];

            try {
                /*
                 * Каждый trigger
                 * проверяем с чистой страницы.
                 */
                if (
                    triggerIndex > 0 ||
                    page.url() !== pageUrl
                ) {
                    await gotoSafely(
                        page,
                        pageUrl,
                        {
                            attempts:
                                2,

                            timeout:
                                18000,

                            settleDelay:
                                300,
                        }
                    );
                }


                const formVisibility =
                    new Map(
                        beforeForms.map(
                            (
                                form
                            ) => [
                                createFormSignature(
                                    form
                                ),

                                form.visible,
                            ]
                        )
                    );


                const beforeFieldPaths =
                    new Set(
                        beforeFields.map(
                            (
                                field
                            ) =>
                                field.domPath
                        )
                    );


                /*
                 * Открываем popup.
                 */
                const opened =
                    await openFormTrigger(
                        page,
                        trigger
                    );


                if (!opened) {
                    continue;
                }

                const [
                    afterForms,
                    afterFields,
                ] =
                    await Promise.all([
                        scanPageForms(
                            page
                        ),

                        scanVisibleFields(
                            page
                        ),
                    ]);


                const newlyVisibleForms =
                    [];


                /*
                 * Сначала старый,
                 * наиболее надёжный способ:
                 * ищем <form>, которая
                 * стала видимой.
                 */
                for (
                    const form of
                    afterForms
                    ) {
                    const signature =
                        createFormSignature(
                            form
                        );


                    if (
                        form.visible &&
                        formVisibility.get(
                            signature
                        ) !==
                        true
                    ) {
                        newlyVisibleForms.push(
                            form
                        );
                    }
                }


                /*
                 * Если настоящая <form>
                 * появилась — используем её.
                 */
                if (
                    newlyVisibleForms.length
                ) {
                    for (
                        const form of
                        newlyVisibleForms
                        ) {
                        forms.push({
                            ...form,

                            source:
                                "popup",

                            trigger: {
                                text:
                                trigger.text,

                                keyword:
                                trigger.keyword,

                                selector:
                                trigger.selector,

                                href:
                                trigger.href,
                            },
                        });
                    }

                    continue;
                }


                /*
                 * =================================
                 * FALLBACK
                 * =================================
                 *
                 * Popup может вообще не использовать
                 * нормальный <form>.
                 *
                 * Поэтому смотрим:
                 * какие поля стали видимыми
                 * именно после клика.
                 */


                const newFields =
                    afterFields.filter(
                        (
                            field
                        ) =>
                            !beforeFieldPaths.has(
                                field.domPath
                            )
                    );
                /*
                 * Если после нажатия
                 * появились новые поля —
                 * создаём виртуальную форму.
                 */
                if (
                    newFields.length
                ) {
                    forms.push({
                        formIndex:
                            -1,

                        sourceFormIndex:
                            null,

                        pageUrl:
                            page.url(),

                        pageTitle:
                            await page.title(),

                        action:
                            "",

                        method:
                            "unknown",

                        visible:
                            true,

                        fields:
                            newFields.map(
                                (
                                    field
                                ) => {
                                    const {
                                        domPath,
                                        ...metadata
                                    } =
                                        field;

                                    return metadata;
                                }
                            ),

                        buttons:
                            [],

                        source:
                            "popup",

                        synthetic:
                            true,

                        trigger: {
                            text:
                            trigger.text,

                            keyword:
                            trigger.keyword,

                            selector:
                            trigger.selector,

                            href:
                            trigger.href,
                        },
                    });
                }
            } catch (
                error
                ) {
            }
        }


        return forms;
    };