# LeadBot Client 0.3

Готовый клиент после рефакторинга и подключения React Router.

## Маршруты

- `/` — Сканер сайтов
- `/companies` — База компаний
- `/campaigns` — Кампании
- `/history` — История

Сканер сохранён рабочим: поиск форм + тестовое заполнение без автоматической отправки.

## Запуск

```bash
npm install
npm run dev
```

Backend LeadBot должен быть запущен отдельно на:

```text
http://localhost:3000
```

## Структура

```text
src/
├── App.jsx
├── App.styles.js
├── main.jsx
├── index.css
├── api/
├── constants/
├── styles/
├── utils/
├── pages/
│   ├── ScannerPage/
│   ├── CompaniesPage/
│   ├── CampaignsPage/
│   └── HistoryPage/
└── components/
    ├── Sidebar/
    ├── Header/
    ├── Scanner/
    ├── LeadData/
    ├── ScanResults/
    └── ComingSoon/
```

## Важно при развёртывании

Используется `BrowserRouter`. На обычном сервере для прямого открытия
`/companies`, `/campaigns` и `/history` позже понадобится SPA fallback
на `index.html`. В режиме Vite dev всё работает сразу.
