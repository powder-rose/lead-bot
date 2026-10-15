import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import { createApp } from '../src/app.js';
import { readServerConfig, readPort } from '../src/config.js';
import { PORT } from '../src/constants.js';
import {
  getInternalScanHeaders,
  getInternalScanUrl,
  isInternalScanRequest,
} from '../src/auth/internalScanAuth.js';
import { scanWebsiteThroughLeadBot } from '../src/services/campaignScanAdapter.js';

const PASSWORD = 'test-only-password-for-leadbot';
const ORIGIN = 'http://localhost:5173';
const requestHeaders = { 'Content-Type': 'application/json', 'X-LeadBot-Request': '1' };

const startApp = async (t, options = {}) => {
  let handled = 0;
  const probe = express.Router();
  probe.use((_req, res) => {
    handled += 1;
    res.json({ error: null, data: { forms: [] } });
  });
  const app = createApp({
    config: { password: PASSWORD, origin: ORIGIN, secureCookies: false, ...options.config },
    routers: { '/api/companies': probe, '/api/scan': probe, '/api/test-fill': probe },
    authOptions: options.authOptions,
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(
    () =>
      new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve()))),
  );
  const url = `http://127.0.0.1:${server.address().port}`;
  const request = (path, init = {}) => fetch(`${url}${path}`, init);
  const login = (init = {}) =>
    request('/api/session', {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ password: PASSWORD }),
      ...init,
    });
  return { url, request, login, handled: () => handled };
};

const cookieOf = response => response.headers.get('set-cookie')?.split(';')[0];

test('access configuration fails closed and requires HTTPS outside local development', () => {
  for (const password of [undefined, '', 'short']) {
    assert.throws(
      () => readServerConfig({ LEADBOT_ACCESS_PASSWORD: password }),
      /LEADBOT_ACCESS_PASSWORD/,
    );
  }
  const env = { LEADBOT_ACCESS_PASSWORD: PASSWORD, NODE_ENV: 'production' };
  for (const origin of [
    undefined,
    'null',
    '*',
    'http://example.com',
    'http://localhost:5173',
    'https://example.com/path',
    'https://user:pass@example.com',
  ]) {
    assert.throws(() => readServerConfig({ ...env, LEADBOT_ORIGIN: origin }), /LEADBOT_ORIGIN/);
  }
  const config = readServerConfig({
    ...env,
    LEADBOT_ORIGIN: 'https://leadbot.example.com',
    PORT: '4567',
  });
  assert.equal(config.secureCookies, true);
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 4567);
  assert.equal(readServerConfig({ LEADBOT_ACCESS_PASSWORD: PASSWORD }).origin, ORIGIN);
  for (const port of ['', '0', '-1', '65536', 'abc', '1.5'])
    assert.throws(() => readPort(port), /PORT/);
});

test('all business endpoints reject anonymous requests before parsing or side effects', async t => {
  const app = await startApp(t);
  for (const [method, path] of [
    ['GET', '/api/companies'],
    ['GET', '/api/companies/filters'],
    ['POST', '/api/companies'],
    ['PATCH', '/api/companies/1'],
    ['DELETE', '/api/companies/all'],
    ['POST', '/api/scan'],
    ['POST', '/api/test-fill'],
    ['POST', '/api/companies/import/preview'],
    ['POST', '/api/companies/import/commit'],
    ['GET', '/api/companies/campaigns'],
    ['POST', '/api/companies/campaigns/1/scan/start'],
    ['POST', '/api/future-endpoint'],
  ]) {
    const init = { method, headers: requestHeaders };
    if (method === 'POST') init.body = '{invalid-json';
    const response = await app.request(path, init);
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(app.handled(), 0);
  const upload = new FormData();
  upload.append('file', new Blob(['fake spreadsheet']), 'test.xlsx');
  assert.equal(
    (await app.request('/api/companies/import/preview', { method: 'POST', body: upload })).status,
    401,
  );
  assert.equal(app.handled(), 0);
  const health = await app.request('/api/health');
  assert.deepEqual(await health.json(), { error: null, data: { status: 'ok' } });
});

test('login, protected reads/writes, session rotation and logout', async t => {
  const app = await startApp(t);
  assert.equal((await (await app.request('/api/session')).json()).data.authenticated, false);
  const denied = await app.login({ body: JSON.stringify({ password: 'wrong' }) });
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get('set-cookie'), null);

  const loggedIn = await app.login();
  assert.equal(loggedIn.status, 200);
  assert.deepEqual(await loggedIn.json(), { error: null, data: { authenticated: true } });
  const cookie = cookieOf(loggedIn);
  assert.match(loggedIn.headers.get('set-cookie'), /HttpOnly/);
  assert.match(loggedIn.headers.get('set-cookie'), /SameSite=Strict/);
  assert.match(loggedIn.headers.get('set-cookie'), /Max-Age=28800/);
  assert.equal((await app.request('/api/companies', { headers: { Cookie: cookie } })).status, 200);
  assert.equal(
    (await app.request('/api/companies/all', { method: 'DELETE', headers: { Cookie: cookie } }))
      .status,
    403,
  );
  assert.equal(
    (
      await app.request('/api/companies/all', {
        method: 'DELETE',
        headers: { ...requestHeaders, Cookie: cookie },
      })
    ).status,
    200,
  );

  const rotated = await app.login({ headers: { ...requestHeaders, Cookie: cookie } });
  const newCookie = cookieOf(rotated);
  assert.notEqual(newCookie, cookie);
  assert.equal((await app.request('/api/companies', { headers: { Cookie: cookie } })).status, 401);
  const logout = await app.request('/api/session', {
    method: 'DELETE',
    headers: { ...requestHeaders, Cookie: newCookie },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  assert.equal(
    (await app.request('/api/companies', { headers: { Cookie: newCookie } })).status,
    401,
  );
});

test('HTTPS sessions use a host-only Secure cookie', async t => {
  const app = await startApp(t, {
    config: { secureCookies: true, origin: 'https://leadbot.example.com' },
  });
  const response = await app.login();
  assert.match(response.headers.get('set-cookie'), /^__Host-leadbot_session=/);
  assert.match(response.headers.get('set-cookie'), /; Secure/);
  assert.doesNotMatch(response.headers.get('set-cookie'), /Domain=/);
});

test('expired, forged and malformed cookies never authorize access', async t => {
  let now = 0;
  const app = await startApp(t, { authOptions: { now: () => now } });
  const cookie = cookieOf(await app.login());
  now = 8 * 60 * 60 * 1000;
  for (const candidate of [
    cookie,
    'leadbot_session=forged',
    'leadbot_session=%zz',
    `leadbot_session=${'a'.repeat(64)}`,
  ]) {
    assert.equal(
      (await app.request('/api/companies', { headers: { Cookie: candidate } })).status,
      401,
    );
  }
  assert.equal(
    (await (await app.request('/api/session', { headers: { Cookie: cookie } })).json()).data
      .authenticated,
    false,
  );
});

test('foreign origins, null origins and simple cross-site submissions are rejected', async t => {
  const app = await startApp(t);
  const cookie = cookieOf(await app.login());
  for (const origin of ['https://evil.example', 'null', `${ORIGIN}.evil.example`]) {
    for (const [method, path] of [
      ['POST', '/api/session'],
      ['DELETE', '/api/companies/all'],
      ['GET', '/api/companies'],
      ['OPTIONS', '/api/companies'],
    ]) {
      const response = await app.request(path, {
        method,
        headers: { ...requestHeaders, Origin: origin, Cookie: cookie },
      });
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('access-control-allow-origin'), null);
    }
  }
  assert.equal((await app.login({ headers: { 'Content-Type': 'application/json' } })).status, 403);
  const preflight = await app.request('/api/companies', {
    method: 'OPTIONS',
    headers: {
      Origin: ORIGIN,
      'Access-Control-Request-Method': 'DELETE',
      'Access-Control-Request-Headers': 'X-LeadBot-Request',
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
  assert.equal(app.handled(), 0);
});

test('login attempts are limited, ignore forged proxy headers, and recover after the window', async t => {
  let now = 0;
  const app = await startApp(t, { authOptions: { now: () => now } });
  for (let i = 0; i < 10; i += 1) {
    const response = await app.login({
      headers: { ...requestHeaders, 'X-Forwarded-For': `10.0.0.${i}` },
      body: JSON.stringify({ password: 'wrong' }),
    });
    assert.equal(response.status, 401);
  }
  const limited = await app.login();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '900');
  now += 15 * 60 * 1000;
  assert.equal((await app.login()).status, 200);
});

test('malformed and oversized login bodies return safe JSON errors', async t => {
  const app = await startApp(t);
  for (const [body, status] of [
    ['{bad', 400],
    [JSON.stringify({ password: 'a'.repeat(9000) }), 413],
    ['{}', 401],
    ['{"password":null}', 401],
  ]) {
    const response = await app.login({ body });
    assert.equal(response.status, status);
    const payload = await response.json();
    assert.equal(typeof payload.error, 'string');
    assert.equal(payload.data, null);
    assert.doesNotMatch(JSON.stringify(payload), /stack|node_modules/);
  }
});

test('internal credential authorizes only local POST scan without a browser origin', async t => {
  const app = await startApp(t);
  const headers = getInternalScanHeaders();
  assert.equal((await app.request('/api/scan', { method: 'POST', headers })).status, 200);
  for (const [method, path] of [
    ['GET', '/api/scan'],
    ['DELETE', '/api/companies/all'],
    ['POST', '/api/test-fill'],
    ['POST', '/api/companies/campaigns'],
  ]) {
    assert.equal((await app.request(path, { method, headers })).status, 401);
  }
  assert.equal(
    (await app.request('/api/scan', { method: 'POST', headers: { ...headers, Origin: ORIGIN } }))
      .status,
    401,
  );
  assert.equal(
    (
      await app.request('/api/scan', {
        method: 'POST',
        headers: { 'x-leadbot-internal-scan': 'wrong' },
      })
    ).status,
    401,
  );
  assert.equal(
    isInternalScanRequest({
      method: 'POST',
      originalUrl: '/api/scan',
      get: name => headers[name],
      socket: { remoteAddress: '192.0.2.1' },
    }),
    false,
  );
  assert.equal(app.handled(), 1);
});

test('campaign adapter authenticates its scan and refuses redirects or remote internal URLs', async t => {
  const app = await startApp(t);
  const actualFetch = globalThis.fetch;
  t.mock.method(globalThis, 'fetch', (url, options) => {
    assert.equal(url, `http://127.0.0.1:${PORT}/api/scan`);
    assert.equal(options.redirect, 'error');
    return actualFetch(`${app.url}/api/scan`, options);
  });
  const result = await scanWebsiteThroughLeadBot('https://example.com');
  assert.equal(result.formsCount, 0);
  assert.equal(app.handled(), 1);
  for (const url of [
    'http://example.com:3000',
    'http://127.0.0.1:1',
    `http://user:pass@127.0.0.1:${PORT}`,
    `http://127.0.0.1:${PORT}/other`,
  ]) {
    assert.throws(() => getInternalScanUrl(url), /LEADBOT_INTERNAL_API_URL/);
  }
});
