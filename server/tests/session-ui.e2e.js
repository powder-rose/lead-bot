/* global document, window */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { chromium } from 'playwright';
import { createApp } from '../src/app.js';

const PASSWORD = 'browser-test-password-only';

test('built UI supports login, reload, mobile logout and expired sessions', async t => {
  let app;
  let now = Date.now();
  let scanCalls = 0;
  const server = createServer((req, res) => app(req, res));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(
    () =>
      new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve()))),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  const scan = express.Router();
  scan.post('/', (_req, res) => {
    scanCalls += 1;
    res.json({
      error: null,
      data: { url: 'https://example.com', title: 'Example', forms: [], formsCount: 0 },
    });
  });
  app = createApp({
    config: { password: PASSWORD, secureCookies: false, origin },
    authOptions: { now: () => now },
    routers: { '/api/scan': scan },
  });
  const dist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
  app.use(express.static(dist));
  app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: dist }));

  const browser = await chromium.launch();
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.setDefaultTimeout(5000);

  // A temporary connectivity failure is recoverable without reloading the page.
  await page.route('**/api/session', route =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"error":"Unavailable"}',
    }),
  );
  await page.goto(`${origin}/history`);
  await page.getByText('Сервер недоступен. Проверьте соединение.').waitFor();
  await page.unroute('**/api/session');
  await page.getByRole('button', { name: 'Повторить', exact: true }).click();
  await page.getByRole('heading', { name: 'Вход в LeadBot' }).waitFor();

  await page.getByLabel('Пароль команды').fill('incorrect-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Неверный пароль' }).waitFor();
  assert.equal(await page.getByLabel('Пароль команды').inputValue(), '');

  const login = async () => {
    await page.getByLabel('Пароль команды').fill(PASSWORD);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await page.getByRole('button', { name: 'Выйти', exact: true }).waitFor();
  };
  await login();
  await page.getByRole('heading', { name: 'История', exact: true }).waitFor();
  const session = (await context.cookies()).find(cookie => cookie.name === 'leadbot_session');
  assert.equal(session.httpOnly, true);
  assert.equal(session.sameSite, 'Strict');
  assert.equal(await page.evaluate(() => document.cookie), '');
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  assert.equal(storage.includes(PASSWORD) || storage.includes(session.value), false);

  await page.reload();
  await page.getByRole('heading', { name: 'История', exact: true }).waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await page.getByRole('heading', { name: 'Вход в LeadBot' }).waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  assert.equal(
    (
      await fetch(`${origin}/api/scan`, {
        method: 'POST',
        headers: { Cookie: `${session.name}=${session.value}`, 'X-LeadBot-Request': '1' },
      })
    ).status,
    401,
  );

  await login();
  await page.goto(origin);
  await page.getByPlaceholder('company.ru').fill('example.com');
  await Promise.all([
    page.waitForResponse(
      response => response.url().endsWith('/api/scan') && response.status() === 200,
    ),
    page.getByRole('button', { name: /^Анализировать/ }).click(),
  ]);
  assert.equal(scanCalls, 1);
  await page.getByText('Подходящих форм не найдено', { exact: true }).waitFor();
  assert.deepEqual(pageErrors, []);

  now += 8 * 60 * 60 * 1000;
  await page.getByRole('button', { name: /^Анализировать/ }).click();
  await page.getByRole('heading', { name: 'Вход в LeadBot' }).waitFor();
  await page.getByText('Сессия завершилась. Войдите снова.').waitFor();
  assert.equal(scanCalls, 1);
  assert.deepEqual(pageErrors, []);
});
