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
                                                field.closest(
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
                                                        wrapper.textContent
                                                    ).slice(
                                                        0,
                                                        250
                                                    )
                                                    : "",

                                            required:
                                                field.required ===
                                                true,
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
                                            ) || "",

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
                                    ) || "",

                                method:
                                    form.getAttribute(
                                        "method"
                                    ) || "get",

                                visible:
                                    isVisible(
                                        form
                                    ),

                                fields,

                                buttons,
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
        await page.waitForTimeout(
            2000
        );

        /*
         * Ждём появления хотя бы DOM.
         */
        await page
            .waitForSelector(
                "body",
                {
                    timeout:
                        5000,
                }
            )
            .catch(
                () => {}
            );


        /*
         * Для диагностики.
         * Сразу увидим, есть ли текст
         * в DOM Playwright.
         */
        const debug =
            await page.evaluate(
                () => {
                    const bodyText =
                        (
                            document.body
                                ?.innerText ||
                            ""
                        )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .trim();

                    const dataH =
                        [
                            ...document.querySelectorAll(
                                "[data-h]"
                            ),
                        ]
                            .slice(
                                0,
                                30
                            )
                            .map(
                                (
                                    element
                                ) => ({
                                    tag:
                                        element.tagName
                                            .toLowerCase(),

                                    text:
                                        (
                                            element.textContent ||
                                            ""
                                        )
                                            .replace(
                                                /\s+/g,
                                                " "
                                            )
                                            .trim()
                                            .slice(
                                                0,
                                                120
                                            ),

                                    dataH:
                                        element.getAttribute(
                                            "data-h"
                                        ),
                                })
                            );

                    return {
                        hasCallbackText:
                            bodyText
                                .toLowerCase()
                                .includes(
                                    "обратный звонок"
                                ),

                        hasApplicationText:
                            bodyText
                                .toLowerCase()
                                .includes(
                                    "оставить заявку"
                                ),

                        dataH,
                    };
                }
            );


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
                [role="button"],
                [onclick],
                [data-h],
                [data-modal],
                [data-popup],
                [data-target],
                [data-toggle]
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

                                text:
                                    clean(
                                        element.textContent
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
                    info.disabled ||
                    info.type ===
                    "submit"
                ) {
                    continue;
                }


                if (
                    info.href.startsWith(
                        "tel:"
                    ) ||
                    info.href.startsWith(
                        "mailto:"
                    ) ||
                    info.href.startsWith(
                        "javascript:"
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
                        info.ariaLabel,
                        info.title,
                        info.dataH,
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
                    info.dataH
                ) {
                    score += 40;
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


                /*
                 * Для firecontrol.su
                 * data-h особенно полезен.
                 */
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
                        info.dataH ||
                        matchedKeyword,

                    keyword:
                    matchedKeyword,

                    selector,

                    tag:
                    info.tag,

                    href:
                    info.href,

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
                                        [data-toggle]
                                    `);


                                if (
                                    !clickable
                                ) {
                                    return null;
                                }


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
        return {
            url:
                page.url(),

            visibleFields:
                await page
                    .locator(`
                        input:visible,
                        textarea:visible,
                        select:visible
                    `)
                    .count()
                    .catch(
                        () => 0
                    ),

            visibleDialogs:
                await page
                    .locator(`
                        [role="dialog"]:visible,
                        [aria-modal="true"]:visible,
                        .modal:visible,
                        .popup:visible,
                        [class*="modal"]:visible,
                        [class*="popup"]:visible
                    `)
                    .count()
                    .catch(
                        () => 0
                    ),

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
            if (
                !(
                    await locator.isVisible()
                )
            ) {
                return false;
            }

            const safe =
                await locator.evaluate(
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

                        return (
                            (
                                element.getAttribute(
                                    "type"
                                ) ||
                                ""
                            ).toLowerCase() !==
                            "submit"
                        );
                    }
                );

            if (!safe) {
                return false;
            }

            const before =
                await getInteractionState(
                    page
                );

            await locator
                .click({
                    timeout:
                        4000,
                })
                .catch(
                    async () =>
                        locator.click({
                            force:
                                true,

                            timeout:
                                3000,
                        })
                );

            await page.waitForTimeout(
                1200
            );

            const after =
                await getInteractionState(
                    page
                );

            return (
                after.pagesCount >
                before.pagesCount ||

                after.visibleFields >
                before.visibleFields ||

                after.visibleDialogs >
                before.visibleDialogs ||

                after.url !==
                before.url
            );
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

        for (
            const role of
            [
                "button",
                "link",
            ]
            ) {
            if (!text) {
                continue;
            }

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
                    6
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


export const scanPopupForms =
    async (
        page,
        pageUrl
    ) => {
        const forms = [];


        await gotoSafely(
            page,
            pageUrl
        );


        const triggers =
            await findFormTriggers(
                page
            );


        for (
            const trigger of
            triggers
            ) {
            try {
                /*
                 * Каждый trigger
                 * проверяем с чистой страницы.
                 */
                await gotoSafely(
                    page,
                    pageUrl
                );


                /*
                 * Обычные <form>
                 * ДО клика.
                 */
                const beforeForms =
                    await scanPageForms(
                        page
                    );


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


                /*
                 * Видимые поля ДО клика.
                 */
                const beforeFields =
                    await scanVisibleFields(
                        page
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


                await page.waitForTimeout(
                    700
                );


                /*
                 * Обычные <form>
                 * ПОСЛЕ клика.
                 */
                const afterForms =
                    await scanPageForms(
                        page
                    );


                /*
                 * Все видимые поля
                 * ПОСЛЕ клика.
                 */
                const afterFields =
                    await scanVisibleFields(
                        page
                    );


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