
import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

import {
    scanPageForms,
    scanInlinePopupForms,
    scanPopupForms,
    openFormTrigger,
} from "../src/scanner.js";

import {
    findFieldGroupByFormIndex,
    fillFieldSafely,
} from "../src/fields.js";

async function withTestPage(html, callback) {
    const browser = await chromium.launch({
        headless: true,
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html);
        await callback(page);
    } finally {
        await browser.close();
    }
}

test("detects a visible form", async () => {
    await withTestPage(`
        <form id="contact-form">
            <input type="text" name="name">
            <input type="tel" name="phone">
            <button type="submit">Отправить</button>
        </form>
    `, async (page) => {
        const forms = await scanPageForms(page);

        assert.equal(forms.length, 1);
        assert.equal(forms[0].visible, true);
        assert.equal(forms[0].fields.length, 2);
    });
});

test("detects a hidden inline popup form", async () => {
    await withTestPage(`
        <button data-src="#callback-modal">
            Оставить заявку
        </button>

        <div id="callback-modal" style="display:none">
            <form>
                <input type="text" name="name">
                <input type="tel" name="phone">
            </form>
        </div>
    `, async (page) => {
        const forms = await scanInlinePopupForms(page);

        assert.ok(forms.length > 0);
        assert.equal(forms[0].source, "inline-popup");
        assert.ok(forms[0].trigger);
    });
});

test("detects a dynamically created popup form", async () => {
    await withTestPage(`
        <button id="open-callback">
            Заказать звонок
        </button>

        <div id="popup-container"></div>

        <script>
            document.querySelector("#open-callback")
                .addEventListener("click", () => {
                    document.querySelector("#popup-container")
                        .innerHTML = \`
                            <form id="callback-form">
                                <input type="text" name="name">
                                <input type="tel" name="phone">
                                <button type="submit">
                                    Отправить
                                </button>
                            </form>
                        \`;
                });
        </script>
    `, async (page) => {
        const forms = await scanPopupForms(
            page,
            page.url(),
            { skipInitialNavigation: true }
        );

        const popup = forms.find(
            (form) => form.source === "popup"
        );

        assert.ok(
            popup,
            "Dynamic popup form was not detected"
        );

        assert.ok(popup.fields.length >= 2);
        assert.ok(popup.trigger);
    });
});

test("reopens a dynamic popup and fills its fields", async () => {
    const html = `
        <button id="open-callback">Заказать звонок</button>
        <div id="popup-container"></div>

        <script>
            document.getElementById("open-callback")
                .addEventListener("click", () => {
                    document.getElementById("popup-container")
                        .innerHTML =
                            '<form id="callback-form">' +
                            '<input type="text" name="name">' +
                            '<input type="tel" name="phone">' +
                            '<button type="submit">Отправить</button>' +
                            '</form>';
                });
        </script>
    `;

    await withTestPage(html, async (page) => {
        // 1. Сначала обнаруживаем форму.
        const forms = await scanPopupForms(
            page,
            page.url(),
            { skipInitialNavigation: true }
        );

        const popup = forms.find(
            (form) => form.source === "popup"
        );

        assert.ok(popup, "Popup form was not detected");
        assert.ok(popup.trigger, "Popup trigger was not saved");

        // 2. Восстанавливаем исходную страницу.
        await page.setContent(html);

        // 3. Повторно открываем ту же форму.
        const opened = await openFormTrigger(
            page,
            popup.trigger
        );

        assert.equal(opened, true, "Popup did not reopen");

        // 4. Находим поля исходной формы.
        const group = await findFieldGroupByFormIndex(
            page,
            popup.sourceFormIndex
        );

        assert.ok(group, "Form fields were not found");

        const nameField = group.fields.find(
            (item) => item.metadata.name === "name"
        );

        const phoneField = group.fields.find(
            (item) => item.metadata.name === "phone"
        );

        assert.ok(nameField, "Name field was not found");
        assert.ok(phoneField, "Phone field was not found");

        // 5. Заполняем поля, не отправляя форму.
        assert.equal(
            await fillFieldSafely(
                nameField.field,
                "Тестовый пользователь",
                nameField.metadata
            ),
            true
        );

        assert.equal(
            await fillFieldSafely(
                phoneField.field,
                "+79990000000",
                phoneField.metadata
            ),
            true
        );

        // 6. Проверяем фактические значения.
        assert.equal(
            await page.locator('input[name="name"]').inputValue(),
            "Тестовый пользователь"
        );

        assert.equal(
            await page.locator('input[name="phone"]').inputValue(),
            "+79990000000"
        );
    });
});

test("detects a contact form opened in a new tab", async () => {
    await withTestPage(`
        <button id="open-external-form">
            Заказать звонок
        </button>

        <script>
            document.getElementById("open-external-form")
                .addEventListener("click", () => {
                    const popup = window.open(
                        "about:blank",
                        "_blank"
                    );

                    popup.document.body.innerHTML = \`
                        <form id="popup-contact-form">
                            <input type="text" name="name">
                            <input type="tel" name="phone">
                            <button type="submit">
                                Отправить
                            </button>
                        </form>
                    \`;
                });
        </script>
    `, async (page) => {
        const forms = await scanPopupForms(
            page,
            page.url(),
            { skipInitialNavigation: true }
        );

        const pages = page.context().pages();

        assert.ok(
            pages.length >= 2,
            "New browser tab was not opened"
        );

        const hasContactForm = forms.some(
            (form) =>
                form.fields.some(
                    (field) => field.name === "phone"
                )
        );

        assert.ok(
            hasContactForm,
            "Contact form in the new tab was not detected"
        );
    });
});
