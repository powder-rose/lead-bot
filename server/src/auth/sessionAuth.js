import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { isInternalScanRequest } from './internalScanAuth.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPTS = 10;
const MAX_SESSIONS = 100;
const MAX_LOGIN_CLIENTS = 1000;
const digest = value => createHash('sha256').update(value).digest();
const fail = (res, status, error) => res.status(status).json({ error, data: null });

// Deliberately process-local: bounded storage for one server and a small trusted team.
// Restarting the server invalidates every session; no credentials are persisted.
export const createSessionAuth = ({ password, secureCookies }, { now = Date.now } = {}) => {
  const passwordHash = digest(password);
  const sessions = new Map();
  const loginClients = new Map();
  const cookieName = secureCookies ? '__Host-leadbot_session' : 'leadbot_session';
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: '/' };
  const router = express.Router();

  const prune = store => {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now()) store.delete(key);
    }
  };

  const sessionKey = req => {
    const value = (req.headers.cookie || '')
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(value || '') ? digest(value).toString('hex') : null;
  };

  const hasSession = req => {
    prune(sessions);
    return sessions.has(sessionKey(req));
  };

  const requireBrowserRequest = (req, res, next) => {
    if (req.get('X-LeadBot-Request') !== '1') {
      return fail(res, 403, 'Запрос не прошёл проверку источника');
    }
    next();
  };

  const limitLogin = (req, res, next) => {
    prune(loginClients);
    // Do not trust X-Forwarded-For supplied by a client. A reverse proxy shares this budget.
    const key = req.socket.remoteAddress;
    let entry = loginClients.get(key);

    if (!entry) {
      if (loginClients.size >= MAX_LOGIN_CLIENTS) {
        res.set('Retry-After', String(LOGIN_WINDOW_MS / 1000));
        return fail(res, 429, 'Слишком много попыток входа. Попробуйте позже');
      }
      entry = { attempts: 0, expiresAt: now() + LOGIN_WINDOW_MS };
      loginClients.set(key, entry);
    }

    if (entry.attempts >= LOGIN_ATTEMPTS) {
      res.set('Retry-After', String(Math.ceil((entry.expiresAt - now()) / 1000)));
      return fail(res, 429, 'Слишком много попыток входа. Попробуйте позже');
    }
    entry.attempts += 1;
    next();
  };

  router.get('/', (req, res) =>
    res.json({ error: null, data: { authenticated: hasSession(req) } }),
  );

  router.post(
    '/',
    requireBrowserRequest,
    limitLogin,
    express.json({ limit: '8kb' }),
    (req, res) => {
      const supplied = req.body?.password;

      if (
        typeof supplied !== 'string' ||
        supplied.length > 1024 ||
        !timingSafeEqual(digest(supplied), passwordHash)
      ) {
        return fail(res, 401, 'Неверный пароль');
      }

      prune(sessions);
      sessions.delete(sessionKey(req));

      if (sessions.size >= MAX_SESSIONS) {
        return fail(res, 503, 'Достигнут лимит сессий. Попробуйте позже');
      }

      const token = randomBytes(32).toString('hex');
      sessions.set(digest(token).toString('hex'), { expiresAt: now() + SESSION_TTL_MS });
      res.cookie(cookieName, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
      return res.json({ error: null, data: { authenticated: true } });
    },
  );

  router.delete('/', requireBrowserRequest, (req, res) => {
    sessions.delete(sessionKey(req));
    res.clearCookie(cookieName, cookieOptions);
    res.json({ error: null, data: { authenticated: false } });
  });

  const requireSession = (req, res, next) => {
    if (isInternalScanRequest(req)) return next();
    if (!hasSession(req)) return fail(res, 401, 'Войдите в LeadBot');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return requireBrowserRequest(req, res, next);
    }
    next();
  };

  return { router, requireSession };
};
