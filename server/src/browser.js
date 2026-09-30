import {
    chromium,
} from "playwright";


let sharedBrowser = null;
let sharedBrowserPromise = null;


/*
 * Один Chromium на весь backend.
 *
 * На каждый scan/test-fill создаётся
 * отдельный BrowserContext, поэтому:
 *
 * - cookies не смешиваются;
 * - страницы не мешают друг другу;
 * - Chromium не запускается заново
 *   для каждого запроса.
 */
const launchSharedBrowser =
    async () => {
        const browser =
            await chromium.launch({
                headless: true,
            });

        sharedBrowser =
            browser;

        browser.on(
            "disconnected",
            () => {
                if (
                    sharedBrowser ===
                    browser
                ) {
                    sharedBrowser =
                        null;
                }

                sharedBrowserPromise =
                    null;
            }
        );

        return browser;
    };


export const getSharedBrowser =
    async () => {
        if (
            sharedBrowser?.isConnected()
        ) {
            return sharedBrowser;
        }

        /*
         * Важно:
         * если одновременно придут несколько
         * запросов, Chromium всё равно
         * запустится только один раз.
         */
        if (!sharedBrowserPromise) {
            sharedBrowserPromise =
                launchSharedBrowser()
                    .catch(
                        (error) => {
                            sharedBrowser =
                                null;

                            sharedBrowserPromise =
                                null;

                            throw error;
                        }
                    );
        }

        return sharedBrowserPromise;
    };


export const createBrowserSession =
    async (
        options = {}
    ) => {
        const {
            /*
             * При обычном сканировании
             * картинки/видео/шрифты нам
             * практически не нужны.
             *
             * JS и CSS НЕ блокируем.
             */
            blockHeavyResources =
                true,

            /*
             * Можно передать cookies +
             * localStorage от другой сессии.
             */
            storageState =
                undefined,
        } = options;

        const browser =
            await getSharedBrowser();

        const context =
            await browser.newContext({
                ignoreHTTPSErrors:
                    true,

                viewport: {
                    width: 1440,
                    height: 1000,
                },

                locale:
                    "ru-RU",

                userAgent:
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                    "Chrome/151.0.0.0 Safari/537.36",

                extraHTTPHeaders: {
                    "Accept-Language":
                        "ru-RU,ru;q=0.9,en;q=0.8",
                },

                ...(storageState
                    ? {
                        storageState,
                    }
                    : {}),
            });

        /*
         * Экономим трафик и ускоряем сайты.
         *
         * CSS и JS обязательно оставляем,
         * потому что они нужны для popup,
         * форм и проверки visibility.
         */
        if (
            blockHeavyResources
        ) {
            await context.route(
                "**/*",
                async (route) => {
                    const resourceType =
                        route.request()
                            .resourceType();

                    if (
                        [
                            "image",
                            "media",
                            "font",
                        ].includes(
                            resourceType
                        )
                    ) {
                        await route
                            .abort()
                            .catch(
                                () => {}
                            );

                        return;
                    }

                    await route
                        .continue()
                        .catch(
                            () => {}
                        );
                }
            );
        }

        const page =
            await context.newPage();

        /*
         * Закрываем только context.
         *
         * Сам Chromium продолжает работать
         * для следующих запросов.
         */
        const close =
            async () => {
                await context
                    .close()
                    .catch(
                        () => {}
                    );
            };

        return {
            browser,
            context,
            page,
            close,
        };
    };


/*
 * Используется только при остановке backend.
 */
export const closeSharedBrowser =
    async () => {
        const browser =
            sharedBrowser ||
            (
                sharedBrowserPromise
                    ? await sharedBrowserPromise
                        .catch(
                            () => null
                        )
                    : null
            );

        sharedBrowser =
            null;

        sharedBrowserPromise =
            null;

        if (
            browser?.isConnected()
        ) {
            await browser
                .close()
                .catch(
                    () => {}
                );
        }
    };


export const gotoSafely =
    async (
        page,
        url,
        options = {}
    ) => {
        const {
            attempts = 3,

            timeout = 20000,

            /*
             * Даём React/Vue/виджетам немного
             * времени после DOMContentLoaded.
             */
            settleDelay = 600,
        } = options;

        let lastError = null;

        for (
            let attempt = 1;
            attempt <= attempts;
            attempt++
        ) {
            try {
                if (
                    attempt > 1
                ) {
                    await page
                        .goto(
                            "about:blank",
                            {
                                waitUntil:
                                    "commit",

                                timeout:
                                    5000,
                            }
                        )
                        .catch(
                            () => {}
                        );

                    /*
                     * Раньше задержка была
                     * attempt * 1200.
                     *
                     * Это слишком сильно
                     * тормозило повторные попытки.
                     */
                    await page.waitForTimeout(
                        400 * attempt
                    );
                }

                const response =
                    await page.goto(
                        url,
                        {
                            /*
                             * Не ждём networkidle:
                             * счётчики/метрика/чаты
                             * могут держать соединение
                             * бесконечно.
                             */
                            waitUntil:
                                "commit",

                            timeout,
                        }
                    );

                await page
                    .waitForLoadState(
                        "domcontentloaded",
                        {
                            timeout:
                                Math.min(
                                    timeout,
                                    10000
                                ),
                        }
                    )
                    .catch(
                        () => {}
                    );

                if (
                    settleDelay > 0
                ) {
                    await page.waitForTimeout(
                        settleDelay
                    );
                }

                const body =
                    page.locator(
                        "body"
                    );

                if (
                    !(await body.count())
                ) {
                    throw new Error(
                        "Страница загрузилась без body"
                    );
                }

                /*
                 * Некоторые страницы практически
                 * не содержат текста, но имеют
                 * полноценную форму.
                 *
                 * Поэтому теперь отсутствие текста
                 * само по себе не считается ошибкой.
                 */
                const [
                    text,
                    controlsCount,
                ] =
                    await Promise.all([
                        body
                            .innerText({
                                timeout:
                                    4000,
                            })
                            .catch(
                                () => ""
                            ),

                        page
                            .locator(`
                                form,
                                input,
                                textarea,
                                select,
                                button
                            `)
                            .count()
                            .catch(
                                () => 0
                            ),
                    ]);

                if (
                    !text.trim() &&
                    !controlsCount
                ) {
                    throw new Error(
                        "Страница загрузилась без содержимого"
                    );
                }

                return response;
            } catch (error) {
                lastError =
                    error;

                console.log(
                    `Ошибка загрузки, попытка ${attempt}:`,
                    error.message
                );
            }
        }

        throw new Error(
            `Не удалось открыть ${url}: ${
                lastError?.message ||
                "неизвестная ошибка"
            }`
        );
    };