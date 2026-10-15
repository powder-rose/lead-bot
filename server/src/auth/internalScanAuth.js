import { randomBytes, timingSafeEqual } from 'node:crypto';
import { PORT } from '../constants.js';

const token = randomBytes(32).toString('hex');
const HEADER = 'x-leadbot-internal-scan';

export const getInternalScanHeaders = () => ({ [HEADER]: token });

export const isInternalScanRequest = req => {
  const supplied = req.get(HEADER);

  return (
    req.method === 'POST' &&
    req.originalUrl.split('?')[0] === '/api/scan' &&
    !req.get('origin') &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) &&
    typeof supplied === 'string' &&
    Buffer.byteLength(supplied) === Buffer.byteLength(token) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(token))
  );
};

export const getInternalScanUrl = (value = process.env.LEADBOT_INTERNAL_API_URL) => {
  const url = new URL(value || `http://127.0.0.1:${PORT}`);

  // The process credential must never be sent to another host or a redirect target.
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    Number(url.port || 80) !== PORT ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('LEADBOT_INTERNAL_API_URL должен указывать на http://127.0.0.1:PORT');
  }

  return new URL('/api/scan', url).href;
};
