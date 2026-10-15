import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';

import { resolvePublicTarget, UnsafeTargetError } from '../src/security/publicTarget.js';

import { BLOCKED_HEADER } from '../src/security/scanProxy.js';

import { getSharedBrowser, closeSharedBrowser, gotoSafely } from '../src/browser.js';

const checkDns = addresses =>
  resolvePublicTarget('https://example.com', {
    lookup: async () => addresses.map(address => ({ address })),
  });

test('public DNS address is allowed', async () => {
  const result = await checkDns(['1.1.1.1']);

  assert.equal(result.addresses[0].address, '1.1.1.1');
});

test('internal DNS addresses are blocked', async () => {
  for (const address of [
    '127.0.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '::1',
    '::ffff:127.0.0.1',
  ]) {
    await assert.rejects(checkDns([address]), UnsafeTargetError);
  }
});

test('mixed public and internal DNS addresses are blocked', async () => {
  await assert.rejects(checkDns(['1.1.1.1', '192.168.1.1']), UnsafeTargetError);
});

test(
  'browser blocks internal connections and redirects',
  {
    timeout: 45000,
  },
  async t => {
    let connections = 0;
    let context;

    const victim = http.createServer((_req, res) => {
      res.end('Local test server');
    });

    victim.on('connection', () => {
      connections += 1;
    });

    t.after(async () => {
      await context?.close();
      await closeSharedBrowser();

      await new Promise(resolve => {
        victim.close(resolve);
        victim.closeAllConnections();
      });
    });

    victim.listen(0, '127.0.0.1');
    await once(victim, 'listening');

    const target = `http://127.0.0.1:${victim.address().port}`;

    const browser = await getSharedBrowser();
    context = await browser.newContext();

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(10000);

    const direct = await page.goto(target);

    assert.equal(direct.status(), 403);
    assert.equal(direct.headers()[BLOCKED_HEADER], '1');
    assert.equal(connections, 0);

    await page.route('http://example.com/ssrf-test', route =>
      route.fulfill({
        status: 302,
        headers: { Location: target },
      }),
    );

    const redirected = await page.goto('http://example.com/ssrf-test');

    assert.equal(redirected.status(), 403);
    assert.equal(redirected.headers()[BLOCKED_HEADER], '1');
    assert.equal(connections, 0);

    // Сканер должен выдать ошибку, а не показать "форм не найдено".
    await assert.rejects(
      gotoSafely(page, 'http://example.com/ssrf-test', {
        attempts: 1,
        timeout: 10000,
        settleDelay: 0,
      }),
      UnsafeTargetError,
    );

    // HTTPS-подключение также не должно достигнуть тестового сервера.
    await assert.rejects(page.goto(target.replace('http:', 'https:')));

    assert.equal(connections, 0);
  },
);
