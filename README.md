# Platform

Монорепозиторий Nx с сервисами на NestJS.

- `apps/api` принимает HTTP-запросы, проверяет JWT и передаёт команды в `account` через RabbitMQ.
- `apps/account` регистрирует пользователей, хранит их в PostgreSQL и выдаёт JWT.
- `libs/contracts`, `libs/auth` и `libs/shared` содержат общие RPC-контракты, проверку JWT и типы.

## Окружение

Для локального запуска нужны Node.js 24, npm и Docker. При первой настройке создайте каждый `.env` из соседнего `.env.example`.

| Файл                | Переменные                                                                              |
| ------------------- | --------------------------------------------------------------------------------------- |
| `.env`              | Общие `RABBITMQ_URL` и `JWT_SECRET`                                                     |
| `apps/account/.env` | `DATABASE_URL`, а для тестового пользователя — `SEED_USER_EMAIL` и `SEED_USER_PASSWORD` |
| `apps/api/.env`     | `PORT` (по умолчанию `3000`)                                                            |

Задайте случайный `JWT_SECRET` длиной не менее 32 байт в корневом `.env`. Приоритет настроек убывает в таком порядке — окружение процесса, `.env` сервиса, корневой `.env`.

## Локальный запуск

1. Установите зависимости — `npm ci`.
2. Поднимите PostgreSQL и RabbitMQ — `docker compose up -d --wait`.
3. Примените миграции — `npm run db:migration:run`.
4. При необходимости задайте `SEED_USER_PASSWORD` и создайте тестового пользователя — `npm run db:seed`.
5. Запустите `npx nx serve account` и `npx nx serve api` в отдельных терминалах.

API по умолчанию доступен на `http://localhost:3000/api`. Панель RabbitMQ доступна на `http://127.0.0.1:15672`. Данные для входа указаны в `compose.yaml`.

## HTTP API

| Маршрут                   | Назначение                                                     |
| ------------------------- | -------------------------------------------------------------- |
| `POST /api/auth/register` | Регистрация пользователя                                       |
| `POST /api/auth/login`    | Вход и выдача `access_token`                                   |
| `GET /api/auth/me`        | Данные пользователя по заголовку `Authorization: Bearer <JWT>` |

## Проверки

- Линтинг и сборка — `npx nx run-many -t lint build`.
- Тесты — `npx nx run-many -t test`.
