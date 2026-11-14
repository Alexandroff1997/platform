# Platform

Монорепозиторий Nx с сервисами на NestJS. Сейчас доступен сервис **account** с PostgreSQL, регистрацией и JWT-аутентификацией.

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

Перед запуском API сгенерируйте секрет и добавьте его в `.env` как `JWT_SECRET` (не менее 32 байт):

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Без корректного `JWT_SECRET` сервис не запустится. Срок действия токена — один час.

Перед запуском сида при необходимости измените `SEED_USER_EMAIL` и `SEED_USER_PASSWORD` в `.env`. Сид предназначен только для локальной базы и не изменяет существующего пользователя.

API доступен по адресу `http://localhost:3000/api`. Проверить вход:

```sh
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test"}'
```

Используйте значения из `.env`. Успешный ответ: `{ "accessToken": "<JWT>" }`.
JWT подписан HS256 и содержит `sub` (id пользователя), `email`, `role`, `iat` и `exp`.

## Регистрация

```sh
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@example.com","password":"MyPassword123!","displayName":"Student"}'
```

Ответ `201`: `{ "email": "student@example.com", "message": "User successfully created" }`.

- `displayName` необязателен: без него сохраняется email.
- `role` необязателен: по умолчанию `Student`; допустим также `Teacher`. Регистр и значения соответствуют существующему enum. Выбор `Teacher` при регистрации разрешён.
- Пароль непустой и не длиннее 72 байт UTF-8; хранится bcrypt-хэш с 12 раундами.
- Повторный email возвращает `409`; неверные поля, `null` и лишние поля — `400`.
- Неверный пароль и неизвестный email при входе возвращают одинаковый `401`.

Токен можно передавать как `Authorization: Bearer <JWT>` при добавлении защищённых маршрутов. В текущей реализации добавлена выдача токена; refresh и защищённые маршруты в этот функционал не входят. Миграции БД не требуются.

## Postman

Импортируйте `postman/collections/account/users.postman_collection.json` (Account - Auth).
Запустите коллекцию целиком через Collection Runner: она создаёт уникальные тестовые email,
проверяет регистрацию Student и Teacher, повторный email, вход, payload и срок JWT,
а также ошибки `400` и `401`. Токен Student сохраняется в переменную `accessToken`.
Переменная `baseUrl` по умолчанию — `http://localhost:3000/api`.
Сценарии создают двух пользователей при каждом запуске; используйте локальную тестовую БД.

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
