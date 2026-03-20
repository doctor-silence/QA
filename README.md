# TestFlow

Проект разделён на две независимые части:

- `frontend` — клиентское приложение на `Vite + React`
- `backend` — минимальный Node.js backend-каркас

## Структура

```text
QA/
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── backend/
│   ├── package.json
│   ├── server.js
│   └── README.md
└── README.md
```

## Запуск frontend

```bash
cd frontend
npm install
npm run dev
```

## Сборка frontend

```bash
cd frontend
npm run build
```

## Запуск backend

```bash
cd backend
cp .env.example .env
npm run dev
```

Backend по умолчанию поднимается на `http://localhost:3001`.

## Полезные маршруты backend

- `GET /health`
- `GET /api/health`
- `GET /api/db/health`
- `GET /api/info`

## PostgreSQL

Backend уже подготовлен для `PostgreSQL`.

Проверить подключение:

```bash
cd backend
npm run db:ping
```

Инициализировать БД схемой:

```bash
cd backend
npm run db:init
```

## Данные приложения

Текущий `frontend` продолжает работать в локальном режиме через `localStorage` браузера и не зависит от backend для основной функциональности.