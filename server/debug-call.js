import {
    createBrowserSession,
    gotoSafely,
} from "./src/browser.js";


const URL =
    "https://dnd69.ru/";

const BUTTON_SELECTOR =
    '[data-fancybox][data-src="#call"]';

const TARGET_SELECTOR =
    "#call";


const printState =
    async (
        page,
        label
    ) => {
        const button =
            page.locator(
                BUTTON_SELECTOR
            );

        const target =
            page.locator(
                TARGET_SELECTOR
            );

        const buttonCount =
            await button
                .count()
                .catch(
                    () => 0
                );

        const targetCount =
            await target
                .count()
                .catch(
                    () => 0
                );

        const targetVisible =
            targetCount
                ? await target
                    .first()
                    .isVisible()
                    .catch(
                        () => false
                    )
                : false;

        const formsInTarget =
            await page
                .locator(
                    "#call form"
                )
                .count()
                .catch(
                    () => 0
                );

        const fieldsInTarget =
            await page
                .locator(`
                    #call input,
                    #call textarea,
                    #call select
                `)
                .count()
                .catch(
                    () => 0
                );

        const visibleForms =
            await page
                .locator(
                    "form:visible"
                )
                .count()
                .catch(
                    () => 0
                );

        const visibleFields =
            await page
                .locator(`
                    input:visible,
                    textarea:visible,
                    select:visible
                `)
                .count()
                .catch(
                    () => 0
                );

        const fancyboxVisible =
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


        console.log(
            `\n========== ${label} ==========`
        );

        console.log({
            url:
                page.url(),

            buttonCount,

            targetCount,

            targetVisible,

            formsInTarget,

            fieldsInTarget,

            visibleForms,

            visibleFields,

            fancyboxVisible,

            frames:
                page.frames()
                    .length,
        });


        if (
            buttonCount
        ) {
            const html =
                await button
                    .first()
                    .evaluate(
                        (
                            element
                        ) =>
                            element.outerHTML
                    )
                    .catch(
                        () => null
                    );

            console.log(
                "\nBUTTON HTML:"
            );

            console.log(
                html
            );
        }


        if (
            targetCount
        ) {
            const fields =
                await page
                    .locator(`
                        #call input,
                        #call textarea,
                        #call select
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

                                    id:
                                        element.id ||
                                        "",

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


            console.log(
                "\nПОЛЯ В #call:"
            );

            console.table(
                fields
            );


            const targetHtml =
                await target
                    .first()
                    .evaluate(
                        (
                            element
                        ) =>
                            element.outerHTML
                                .slice(
                                    0,
                                    5000
                                )
                    )
                    .catch(
                        () => null
                    );


            console.log(
                "\nНАЧАЛО #call HTML:"
            );

            console.log(
                targetHtml
            );
        }
    };


const run =
    async () => {
        let session;


        try {
            session =
                await createBrowserSession({
                    /*
                     * Для диагностики ничего
                     * не блокируем.
                     */
                    blockHeavyResources:
                        false,
                });


            const page =
                session.page;


            await gotoSafely(
                page,
                URL,
                {
                    attempts:
                        2,

                    timeout:
                        25000,

                    /*
                     * Даём Fancybox и jQuery
                     * нормально загрузиться.
                     */
                    settleDelay:
                        2000,
                }
            );


            /*
             * =================================
             * ДО КЛИКА
             * =================================
             */

            await printState(
                page,
                "ДО КЛИКА"
            );


            const button =
                page
                    .locator(
                        BUTTON_SELECTOR
                    )
                    .first();


            if (
                !(
                    await button
                        .count()
                        .catch(
                            () => 0
                        )
                )
            ) {
                console.log(
                    "\n❌ Кнопка не найдена"
                );

                return;
            }


            /*
             * =================================
             * КЛИКАЕМ ИМЕННО НА НУЖНУЮ КНОПКУ
             * =================================
             */

            console.log(
                "\nКликаем:",
                BUTTON_SELECTOR
            );


            try {
                await button.click({
                    timeout:
                        5000,
                });

                console.log(
                    "✅ normal click выполнен"
                );
            } catch (
                error
            ) {
                console.log(
                    "Normal click не сработал:",
                    error.message
                );


                try {
                    await button.click({
                        force:
                            true,

                        timeout:
                            3000,
                    });

                    console.log(
                        "✅ force click выполнен"
                    );
                } catch (
                    forceError
                ) {
                    console.log(
                        "❌ force click тоже не сработал:",
                        forceError.message
                    );
                }
            }


            await page.waitForTimeout(
                1500
            );


            /*
             * =================================
             * ПОСЛЕ КЛИКА
             * =================================
             */

            await printState(
                page,
                "ПОСЛЕ КЛИКА"
            );


            /*
             * Дополнительно посмотрим
             * все видимые поля после click.
             */
            const visibleFields =
                await page
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


            console.log(
                "\nВСЕ ВИДИМЫЕ ПОЛЯ ПОСЛЕ КЛИКА:"
            );

            console.table(
                visibleFields
            );


            /*
             * И iframe тоже проверяем.
             */
            console.log(
                "\nFRAME'Ы:"
            );


            for (
                const [
                    index,
                    frame,
                ] of
                page.frames()
                    .entries()
            ) {
                const count =
                    await frame
                        .locator(`
                            input:visible,
                            textarea:visible,
                            select:visible
                        `)
                        .count()
                        .catch(
                            () => 0
                        );


                console.log({
                    index,

                    url:
                        frame.url(),

                    visibleFields:
                        count,
                });
            }
        } catch (
            error
        ) {
            console.error(
                "\n❌ DEBUG ERROR:",
                error
            );
        } finally {
            if (session) {
                await session.close();
            }
        }
    };


run();