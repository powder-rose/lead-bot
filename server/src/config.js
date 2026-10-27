export const readPort = (value = '3000') => {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT должен быть целым числом от 1 до 65535');
  }

  return port;
};

export const readServerConfig = (env = process.env) => {
  const password = env.LEADBOT_ACCESS_PASSWORD;

  if (typeof password !== 'string' || password.length < 16 || password.length > 1024) {
    throw new Error('Задайте LEADBOT_ACCESS_PASSWORD длиной от 16 до 1024 символов');
  }

  const originValue =
    env.LEADBOT_ORIGIN || (env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');
  let origin;

  try {
    origin = new URL(originValue);
  } catch {
    throw new Error('Задайте LEADBOT_ORIGIN, например https://leadbot.example.com');
  }

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);

  if (
    origin.origin !== originValue ||
    origin.username ||
    origin.password ||
    !['http:', 'https:'].includes(origin.protocol) ||
    (origin.protocol !== 'https:' && (!local || env.NODE_ENV === 'production'))
  ) {
    throw new Error(
      'LEADBOT_ORIGIN должен быть HTTPS origin без пути; HTTP разрешён только локально вне production',
    );
  }

  const host = env.HOST || '127.0.0.1';

  if (!['127.0.0.1', '0.0.0.0'].includes(host)) {
    throw new Error('HOST должен быть 127.0.0.1 или 0.0.0.0');
  }

  return {
    password,
    origin: origin.origin,
    secureCookies: origin.protocol === 'https:',
    host,
    port: readPort(env.PORT),
  };
};
