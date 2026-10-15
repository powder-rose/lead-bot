import express from 'express';
import cors from 'cors';
import { createSessionAuth } from './auth/sessionAuth.js';

export const createApp = ({ config, routers = {}, authOptions }) => {
  const app = express();
  const auth = createSessionAuth(config, authOptions);
  app.disable('x-powered-by');

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    if (origin && origin !== config.origin) {
      return res.status(403).json({ error: 'Источник запроса не разрешён', data: null });
    }
    next();
  });
  app.use(
    '/api',
    cors({
      origin: config.origin,
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-LeadBot-Request'],
    }),
  );

  app.get('/api/health', (_req, res) => res.json({ error: null, data: { status: 'ok' } }));
  app.use('/api/session', auth.router);

  // Authentication runs before JSON parsing, multipart uploads and all business handlers.
  app.use('/api', auth.requireSession);
  app.use(express.json());
  for (const [path, router] of Object.entries(routers)) {
    app.use(path, router);
  }
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Маршрут не найден', data: null }));
  app.use((error, _req, res, _next) => {
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    const message =
      status === 413
        ? 'Слишком большой запрос'
        : status === 400
          ? 'Некорректный запрос'
          : 'Ошибка сервера';
    res.status(status).json({ error: message, data: null });
  });
  return app;
};
