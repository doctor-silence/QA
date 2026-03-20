# Backend

Backend для `TestFlow` с базовой интеграцией `PostgreSQL`.

## Подготовка

Скопируйте пример env и заполните параметры подключения:

```bash
cp .env.example .env
```

Можно использовать либо `DATABASE_URL`, либо набор `POSTGRES_*` переменных.

## Команды

```bash
npm install
npm run dev
```

## PostgreSQL

Проверка подключения:

```bash
npm run db:ping
```

Инициализация схемы:

```bash
npm run db:init
```

## Доступные маршруты

- `GET /health`
- `GET /api/health`
- `GET /api/db/health`
- `GET /api/info`

## Структура

- `db/schema.sql` — стартовая схема PostgreSQL
- `db/pool.js` — пул подключений `pg`
- `lib/env.js` — загрузка и нормализация env
- `scripts/init-db.js` — применение схемы
- `scripts/ping-db.js` — проверка подключения
