import {
    chromium,
} from "playwright";


export const createBrowserSession =
    async () => {
        const browser =
            await chromium.launch({
                headless: true,
            });

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
            });

        const page =
            await context.newPage();

        return {
            browser,
            context,
            page,
        };
    };


export const gotoSafely =
    async (
        page,
        url,
        options = {}
    ) => {
        const {
            attempts = 4,
            timeout = 30000,
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

                    await page.waitForTimeout(
                        attempt *
                        1200
                    );
                }

                const response =
                    await page.goto(
                        url,
                        {
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
                                15000,
                        }
                    )
                    .catch(
                        () => {}
                    );

                await page.waitForTimeout(
                    1000
                );

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

                const text =
                    await body
                        .innerText({
                            timeout:
                                5000,
                        })
                        .catch(
                            () => ""
                        );

                if (
                    !text.trim()
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