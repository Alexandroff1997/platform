# Platform

Монорепозиторий Nx с сервисами на NestJS. Сейчас доступен сервис **account** с PostgreSQL и проверкой учётных данных.

## Быстрый старт

Потребуются Node.js 24, npm и Docker.

```sh
npm ci
cp .env.example .env
docker compose up -d --wait
npm run db:migration:run
npm run db:seed
npx nx serve account
```

Перед запуском сида при необходимости измените `SEED_USER_EMAIL` и `SEED_USER_PASSWORD` в `.env`. Сид предназначен только для локальной базы и не изменяет существующего пользователя.

API доступен по адресу `http://localhost:3000/api`. Проверить вход:

```sh
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test"}'
```

Используйте значения из `.env`. При успешной проверке ответ — `{ "valid": true }`; токен или сессия не создаются.

## Команды

```sh
npx nx run-many -t lint build  # проверка и сборка
npm run db:migration:show      # статус миграций
npm run db:migration:revert    # откат последней миграции
```

Откат миграции создания пользователей удаляет таблицу и её данные.

## Unit-тесты

Запустить все unit-тесты сервиса `account`:

```sh
nx test account
```

Для автоматического повторного запуска при изменении файлов:

```sh
nx test account --watch
```

Запустить тесты во всех проектах монорепозитория, для которых настроен target `test`:

```sh
nx run-many -t test
```

Чтобы проверить только затронутые проекты после изменений:

```sh
nx affected -t test --base=origin/main
```

Первый запуск требует установленных зависимостей (`npm ci`).

## Структура

- `apps/account` — сервис, миграции и сиды.
- `libs/shared` — общие контракты `@platform/shared`.
- `compose.yaml` — локальный PostgreSQL.

Конфигурация читается из окружения процесса, затем из `apps/account/.env` и корневого `.env`. Секреты храните только в `.env`, а не в файлах-примерах.
