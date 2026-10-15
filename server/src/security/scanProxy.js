import http from 'node:http';
import net from 'node:net';
import { once } from 'node:events';

import { resolvePublicTarget, UnsafeTargetError } from './publicTarget.js';

export const BLOCKED_HEADER = 'x-leadbot-network-blocked';

const cleanHeaders = headers => {
  const ignored = new Set([
    'connection',
    'proxy-connection',
    'proxy-authorization',
    'proxy-authenticate',
    'keep-alive',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    ...(headers.connection || '')
      .toLowerCase()
      .split(',')
      .map(value => value.trim()),
  ]);

  return Object.fromEntries(Object.entries(headers).filter(([name]) => !ignored.has(name)));
};

const checkedTarget = async value => {
  const target = await resolvePublicTarget(value);

  return {
    ...target,
    ...target.addresses[0],
    port: target.url.protocol === 'https:' ? 443 : 80,
  };
};

export const createScanProxy = async () => {
  const sockets = new Set();
  let closing = false;
  let closePromise;

  const track = socket => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.once('close', () => sockets.delete(socket));
    socket.setTimeout(30000, () => socket.destroy());

    return socket;
  };

  const openSocket = target => {
    if (closing) {
      throw new Error('Proxy closed');
    }

    // Подключаемся к проверенному IP, без повторного DNS-запроса.
    return track(
      net.connect({
        host: target.address,
        port: target.port,
        family: target.family,
      }),
    );
  };

  const server = http.createServer(async (req, res) => {
    req.on('error', () => {});

    try {
      const target = await checkedTarget(req.url);

      if (target.url.protocol !== 'http:') {
        throw new UnsafeTargetError('Недопустимый запрос');
      }

      if (closing || req.destroyed || res.destroyed) {
        return;
      }

      const agent = new http.Agent({ keepAlive: false });
      agent.createConnection = () => openSocket(target);

      const upstream = http.request(
        {
          host: target.address,
          port: target.port,
          method: req.method,
          path: `${target.url.pathname}${target.url.search}`,
          headers: {
            ...cleanHeaders(req.headers),
            host: target.url.host,
          },
          agent,
        },
        response => {
          res.writeHead(response.statusCode, cleanHeaders(response.headers));

          response.on('error', () => res.destroy());
          response.pipe(res);
        },
      );

      upstream.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(502);
        }

        res.end('Site unavailable');
      });

      req.once('aborted', () => upstream.destroy());

      res.once('close', () => {
        upstream.destroy();
        agent.destroy();
      });

      req.pipe(upstream);
    } catch (error) {
      if (res.destroyed) {
        return;
      }

      const denied = error instanceof UnsafeTargetError;

      res.writeHead(denied ? 403 : 502, denied ? { [BLOCKED_HEADER]: '1' } : {});

      res.end(denied ? 'Target blocked' : 'Site unavailable');
    }
  });

  server.on('connection', track);

  // Отдельные WebSocket-подключения пока запрещаем.
  server.on('upgrade', (_req, socket) => socket.destroy());

  // HTTPS проходит через туннель к проверенному IP.
  server.on('connect', async (req, client, head) => {
    try {
      const target = await checkedTarget(`https://${req.url}`);

      if (target.url.pathname !== '/' || target.url.search || target.url.hash) {
        throw new UnsafeTargetError('Недопустимый HTTPS адрес');
      }

      if (closing || client.destroyed) {
        return;
      }

      const upstream = openSocket(target);

      client.once('close', () => upstream.destroy());
      upstream.once('close', () => client.destroy());

      upstream.once('error', () => {
        client.destroy();
        upstream.destroy();
      });

      upstream.once('connect', () => {
        if (client.destroyed) {
          upstream.destroy();
          return;
        }

        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');

        if (head.length) {
          upstream.write(head);
        }

        client.pipe(upstream);
        upstream.pipe(client);
      });
    } catch {
      if (!client.destroyed) {
        client.end(
          'HTTP/1.1 403 Forbidden\r\n' + 'Connection: close\r\n' + 'Content-Length: 0\r\n\r\n',
        );
      }
    }
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  return {
    url: `http://127.0.0.1:${server.address().port}`,

    close: () => {
      if (!closePromise) {
        closing = true;

        closePromise = new Promise((resolve, reject) => {
          server.close(error => {
            if (error) reject(error);
            else resolve();
          });

          for (const socket of sockets) {
            socket.destroy();
          }
        });
      }

      return closePromise;
    },
  };
};
