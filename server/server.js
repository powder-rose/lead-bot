import { readServerConfig } from './src/config.js';
import { createApp } from './src/app.js';
import { getInternalScanUrl } from './src/auth/internalScanAuth.js';

// Validate access settings before loading modules that open the database.
const config = readServerConfig();
getInternalScanUrl();
const [companies, scan, testFill, companiesImport, { closeSharedBrowser }] = await Promise.all([
  import('./src/routes/companies.js'),
  import('./src/routes/scan.js'),
  import('./src/routes/test-fill.js'),
  import('./src/routes/companies-import.js'),
  import('./src/browser.js'),
]);

const app = createApp({
  config,
  routers: {
    '/api/scan': scan.default,
    '/api/test-fill': testFill.default,
    '/api/companies': companies.default,
    '/api/companies/import': companiesImport.default,
  },
});

const server = app.listen(config.port, config.host, () => {
  console.log(`Server started: http://${config.host}:${config.port}`);
});

let shuttingDown = false;

const shutdown = async signal => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`Получен ${signal}. Завершаем сервер...`);

  server.close(async () => {
    await closeSharedBrowser();

    console.log('LeadBot остановлен корректно');

    process.exit(0);
  });

  /*
   * Защита на случай зависшего HTTP-запроса.
   */
  setTimeout(async () => {
    await closeSharedBrowser();

    process.exit(1);
  }, 5000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));

process.on('SIGTERM', () => shutdown('SIGTERM'));
