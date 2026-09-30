import {
    createBrowserSession,
    gotoSafely,
} from "./src/browser.js";


const URL =
    process.argv[2] ||
    "https://dnd69.ru/";

const SEARCH_TEXT =
    (
        process.argv[3] ||
        "оставить заявку"
    )
        .trim()
        .toLowerCase();


const getPageState =
    async (page) => {
        let visibleFields =
            0;

        let visibleForms =
            0;

        let visibleDialogs =
            0;


        for (
            const frame of
            page.frames()
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


                visibleForms +=
                    await frame
                        .locator(
                            "form:visible"
                        )
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

                            [class*="modal"]:visible,
                            [class*="popup"]:visible,
                            [class*="dialog"]:visible
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

            visibleForms,

            visibleDialogs,

            frames:
                page.frames()
                    .length,

            pages:
                page.context()
                    .pages()
                    .length,
        };
    };


const stateChanged =
    (
        before,
        after
    ) => {
        return (
            after.url !==
                before.url ||

            after.visibleFields >
                before.visibleFields ||

            after.visibleForms >
                before.visibleForms ||

            after.visibleDialogs >
                before.visibleDialogs ||

            after.frames >
                before.frames ||

            after.pages >
                before.pages
        );
    };


const waitForChange =
    async (
        page,
        before
    ) => {
        for (
            let attempt = 0;
            attempt < 25;
            attempt++
        ) {
            await page.waitForTimeout(
                120
            );

            const after =
                await getPageState(
                    page
                );

            if (
                stateChanged(
                    before,
                    after
                )
            ) {
                return after;
            }
        }

        return getPageState(
            page
        );
    };


const findCandidates =
    async (page) => {
        return page.evaluate(
            (
                searchText
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


                const getPseudoText =
                    (
                        element,
                        pseudo
                    ) => {
                        try {
                            let content =
                                getComputedStyle(
                                    element,
                                    pseudo
                                ).content;

                            if (
                                !content ||
                                content ===
                                    "none" ||
                                content ===
                                    "normal"
                            ) {
                                return "";
                            }

                            content =
                                content.replace(
                                    /^["']|["']$/g,
                                    ""
                                );

                            return clean(
                                content
                            );
                        } catch {
                            return "";
                        }
                    };


                const getSelector =
                    (
                        element
                    ) => {
                        if (
                            !element ||
                            element ===
                                document.documentElement
                        ) {
                            return "";
                        }

                        if (
                            element.id
                        ) {
                            return (
                                "#" +
                                CSS.escape(
                                    element.id
                                )
                            );
                        }


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


                            const parent =
                                current
                                    .parentElement;


                            if (parent) {
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
                                            ) + 1
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
                            "body > " +
                            parts.join(
                                " > "
                            )
                        );
                    };


                const isVisible =
                    (
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

                            rect.width >
                                0 &&

                            rect.height >
                                0
                        );
                    };


                const results =
                    [];


                const elements =
                    [
                        ...document
                            .querySelectorAll(
                                "body *"
                            ),
                    ];


                for (
                    const element of
                    elements
                ) {
                    const beforeText =
                        getPseudoText(
                            element,
                            "::before"
                        );

                    const afterText =
                        getPseudoText(
                            element,
                            "::after"
                        );


                    const dataset =
                        Object.values(
                            element.dataset ||
                            {}
                        )
                            .join(
                                " "
                            );


                    const text =
                        [
                            element.textContent,

                            element.getAttribute(
                                "value"
                            ),

                            element.getAttribute(
                                "aria-label"
                            ),

                            element.getAttribute(
                                "title"
                            ),

                            element.getAttribute(
                                "alt"
                            ),

                            element.getAttribute(
                                "href"
                            ),

                            element.id,

                            typeof element.className ===
                            "string"
                                ? element.className
                                : "",

                            dataset,

                            beforeText,

                            afterText,
                        ]
                            .filter(
                                Boolean
                            )
                            .join(
                                " "
                            )
                            .replace(
                                /\s+/g,
                                " "
                            )
                            .toLowerCase();


                    if (
                        !text.includes(
                            searchText
                        )
                    ) {
                        continue;
                    }


                    const selectors =
                        [];

                    let current =
                        element;


                    /*
                     * Пробуем сам элемент
                     * и несколько его родителей.
                     *
                     * JS click-handler очень часто
                     * висит именно на родителе span.
                     */
                    for (
                        let level = 0;
                        level < 5 &&
                        current &&
                        current !==
                            document.body;
                        level++
                    ) {
                        const selector =
                            getSelector(
                                current
                            );

                        if (
                            selector &&
                            !selectors.includes(
                                selector
                            )
                        ) {
                            selectors.push(
                                selector
                            );
                        }

                        current =
                            current
                                .parentElement;
                    }


                    const rect =
                        element
                            .getBoundingClientRect();


                    results.push({
                        tag:
                            element.tagName
                                .toLowerCase(),

                        text:
                            clean(
                                element.textContent
                            ).slice(
                                0,
                                200
                            ),

                        value:
                            clean(
                                element.getAttribute(
                                    "value"
                                )
                            ),

                        href:
                            clean(
                                element.getAttribute(
                                    "href"
                                )
                            ),

                        id:
                            element.id ||
                            "",

                        className:
                            typeof element.className ===
                            "string"
                                ? element.className
                                    .slice(
                                        0,
                                        250
                                    )
                                : "",

                        role:
                            element.getAttribute(
                                "role"
                            ) || "",

                        onclick:
                            clean(
                                element.getAttribute(
                                    "onclick"
                                )
                            ).slice(
                                0,
                                300
                            ),

                        cursor:
                            getComputedStyle(
                                element
                            ).cursor,

                        visible:
                            isVisible(
                                element
                            ),

                        width:
                            Math.round(
                                rect.width
                            ),

                        height:
                            Math.round(
                                rect.height
                            ),

                        beforeText,

                        afterText,

                        selectors,

                        html:
                            element.outerHTML
                                .slice(
                                    0,
                                    800
                                ),
                    });


                    if (
                        results.length >=
                        30
                    ) {
                        break;
                    }
                }


                return results;
            },
            SEARCH_TEXT
        );
    };


const run =
    async () => {
        let session;


        try {
            session =
                await createBrowserSession({
                    /*
                     * На диагностике ничего
                     * не блокируем.
                     *
                     * Иногда старый JS сайта
                     * зависит от сторонних
                     * ресурсов.
                     */
                    blockHeavyResources:
                        false,
                });


            const {
                page,
            } =
                session;


            console.log(
                "\n================================"
            );

            console.log(
                "URL:",
                URL
            );

            console.log(
                "Ищем:",
                SEARCH_TEXT
            );

            console.log(
                "================================\n"
            );


            await gotoSafely(
                page,
                URL,
                {
                    attempts:
                        2,

                    timeout:
                        25000,

                    settleDelay:
                        1500,
                }
            );


            console.log(
                "Открыта страница:",
                page.url()
            );

            console.log(
                "Title:",
                await page.title()
            );


            const initialState =
                await getPageState(
                    page
                );


            console.log(
                "\nНачальное состояние:"
            );

            console.log(
                initialState
            );


            const candidates =
                await findCandidates(
                    page
                );


            console.log(
                `\nНайдено элементов с текстом "${SEARCH_TEXT}":`,
                candidates.length
            );


            candidates.forEach(
                (
                    candidate,
                    index
                ) => {
                    console.log(
                        `\n========== КАНДИДАТ ${index + 1} ==========`
                    );

                    console.log({
                        tag:
                            candidate.tag,

                        text:
                            candidate.text,

                        value:
                            candidate.value,

                        href:
                            candidate.href,

                        id:
                            candidate.id,

                        className:
                            candidate.className,

                        role:
                            candidate.role,

                        onclick:
                            candidate.onclick,

                        cursor:
                            candidate.cursor,

                        visible:
                            candidate.visible,

                        size:
                            `${
                                candidate.width
                            }x${
                                candidate.height
                            }`,

                        beforeText:
                            candidate.beforeText,

                        afterText:
                            candidate.afterText,
                    });

                    console.log(
                        "HTML:",
                        candidate.html
                    );

                    console.log(
                        "Selectors:",
                        candidate.selectors
                    );
                }
            );


            /*
             * ====================================
             * ПРОБУЕМ КЛИКАТЬ НАЙДЕННЫЕ ЭЛЕМЕНТЫ
             * ====================================
             */

            const tried =
                new Set();


            for (
                let candidateIndex = 0;
                candidateIndex <
                candidates.length;
                candidateIndex++
            ) {
                const candidate =
                    candidates[
                        candidateIndex
                    ];


                for (
                    const selector of
                    candidate.selectors
                ) {
                    if (
                        tried.has(
                            selector
                        )
                    ) {
                        continue;
                    }

                    tried.add(
                        selector
                    );


                    /*
                     * Каждый тест начинаем
                     * с чистой страницы.
                     */
                    await gotoSafely(
                        page,
                        URL,
                        {
                            attempts:
                                2,

                            timeout:
                                25000,

                            settleDelay:
                                800,
                        }
                    );


                    const locator =
                        page
                            .locator(
                                selector
                            )
                            .first();


                    const exists =
                        await locator
                            .count()
                            .catch(
                                () => 0
                            );


                    if (!exists) {
                        continue;
                    }


                    const visible =
                        await locator
                            .isVisible()
                            .catch(
                                () => false
                            );


                    if (!visible) {
                        continue;
                    }


                    console.log(
                        "\nПРОБУЕМ:",
                        selector
                    );


                    const before =
                        await getPageState(
                            page
                        );


                    let clickMethod =
                        "";


                    /*
                     * 1. Нормальный пользовательский
                     * click.
                     */
                    try {
                        await locator.click({
                            timeout:
                                3000,
                        });

                        clickMethod =
                            "normal click";
                    } catch {
                        /*
                         * 2. Force click.
                         */
                        try {
                            await locator.click({
                                force:
                                    true,

                                timeout:
                                    2000,
                            });

                            clickMethod =
                                "force click";
                        } catch {
                            /*
                             * 3. Последний диагностический
                             * вариант — DOM .click().
                             */
                            try {
                                await locator.evaluate(
                                    (
                                        element
                                    ) =>
                                        element.click()
                                );

                                clickMethod =
                                    "DOM click";
                            } catch {
                                continue;
                            }
                        }
                    }


                    const after =
                        await waitForChange(
                            page,
                            before
                        );


                    console.log(
                        "Метод:",
                        clickMethod
                    );

                    console.log(
                        "До:",
                        before
                    );

                    console.log(
                        "После:",
                        after
                    );


                    if (
                        stateChanged(
                            before,
                            after
                        )
                    ) {
                        console.log(
                            "\n🔥 НАЙДЕН РАБОЧИЙ ЭЛЕМЕНТ!"
                        );

                        console.log(
                            "Selector:",
                            selector
                        );

                        console.log(
                            "Candidate:",
                            candidate
                        );


                        /*
                         * Посмотрим поля,
                         * появившиеся после click.
                         */
                        for (
                            const [
                                frameIndex,
                                frame,
                            ] of
                            page.frames()
                                .entries()
                        ) {
                            const fields =
                                await frame
                                    .locator(`
                                        input:visible,
                                        textarea:visible,
                                        select:visible
                                    `)
                                    .evaluateAll(
                                        (
                                            elements
                                        ) =>
                                            elements.map(
                                                (
                                                    element
                                                ) => ({
                                                    tag:
                                                        element.tagName
                                                            .toLowerCase(),

                                                    type:
                                                        element.getAttribute(
                                                            "type"
                                                        ) || "",

                                                    name:
                                                        element.getAttribute(
                                                            "name"
                                                        ) || "",

                                                    placeholder:
                                                        element.getAttribute(
                                                            "placeholder"
                                                        ) || "",

                                                    value:
                                                        element.getAttribute(
                                                            "value"
                                                        ) || "",
                                                })
                                            )
                                    )
                                    .catch(
                                        () => []
                                    );


                            if (
                                fields.length
                            ) {
                                console.log(
                                    `\nFRAME ${frameIndex}:`,
                                    frame.url()
                                );

                                console.log(
                                    fields
                                );
                            }
                        }


                        return;
                    }
                }
            }


            console.log(
                "\n❌ Ни один найденный элемент не изменил состояние страницы."
            );
        } catch (error) {
            console.error(
                "\nDEBUG ERROR:",
                error
            );
        } finally {
            if (session) {
                await session.close();
            }
        }
    };


run();