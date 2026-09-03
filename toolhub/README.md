# ToolHub

Каталог инструментов (Windows / Game / Roblox / Crypto) на React + TypeScript,
Express и PostgreSQL, со скрытой админ-панелью и полноценной CMS.

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router 7, TanStack Query, React Hook Form, Zod, Lucide |
| Backend | Express 5 (ESM), Prisma 6, PostgreSQL 16, Zod, helmet, express-rate-limit |
| Auth | bcrypt + JWT в httpOnly cookie, double-submit CSRF, роли |
| Storage | локальный диск или любой S3-совместимый бакет (Cloudflare R2, Supabase, MinIO) |

Графики нарисованы обычным SVG, дополнительных зависимостей для них нет.

## Запуск

```bash
cp .env.example .env      # укажите DATABASE_URL и JWT_SECRET
docker compose up -d db   # или используйте свой PostgreSQL
npm install
npm run db:migrate        # применить миграции
npm run db:seed           # demo-контент: продукты, страницы, 90 дней аналитики
npm run dev               # http://localhost:5173, API на :4000
```

Production:

```bash
npm run build && npm start   # Express отдаёт dist/ и API с одного порта
```

Учётная запись из сида: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` из `.env`
(по умолчанию `admin@toolhub.local` / `ChangeMe123!`). **Смените пароль сразу
после первого входа.**

## Скрытая админ-панель

Публичный сайт полностью анонимный: регистрации и входа для посетителей нет,
отзывы отправляются без аккаунта и проходят модерацию.

Панель управления доступна только сотрудникам и спрятана:

- на сайте нет ни одной ссылки на неё, и её код лежит в отдельном chunk,
  который посетитель вообще не скачивает;
- путь настраивается: `VITE_ADMIN_PATH` при сборке фронтенда и `ADMIN_PATH`
  на сервере (чтобы совпал `robots.txt`). По умолчанию `/admin`, для боевого
  сайта задайте что-то неугадываемое, например `/p-7f3a91`;
- страница отдаётся с `X-Robots-Tag: noindex, nofollow`, запрещена в
  `robots.txt` и не попадает в `sitemap.xml`;
- без валидной сессии видна только форма входа, никаких данных каталога.

```bash
# пример боевой конфигурации
ADMIN_PATH=/p-7f3a91          # .env для сервера
VITE_ADMIN_PATH=/p-7f3a91 npm run build
```

Скрытый путь это не замена авторизации, а дополнительный слой: доступ всё
равно проверяется на сервере при каждом запросе.

## Роли

| Роль | Права |
| --- | --- |
| `super_admin` | всё, включая сотрудников, настройки и audit log |
| `editor` | продукты, категории, страницы, медиа |
| `moderator` | модерация отзывов, чтение контента |
| `analyst` | только аналитика и чтение каталога |

Права проверяются на сервере на каждом запросе; меню в интерфейсе это лишь
удобство, а не граница безопасности.

## API

```
GET    /api/health

POST   /api/auth/login             POST /api/auth/logout
GET    /api/auth/me                POST /api/auth/password

GET    /api/products               GET  /api/products/suggest
GET    /api/products/:idOrSlug     GET  /api/products/:id/related
GET    /api/products/:id/download  (счётчик + событие + redirect)
GET    /api/products/export/csv
POST   /api/products               PUT  /api/products/:id
DELETE /api/products/:id           POST /api/products/bulk

GET    /api/categories             GET  /api/categories/:idOrSlug
POST   /api/categories             PUT  /api/categories/:id
DELETE /api/categories/:id         POST /api/categories/reorder

GET    /api/pages                  GET  /api/pages/:slug
PUT    /api/pages/:slug            DELETE /api/pages/:slug

GET    /api/reviews                POST /api/reviews
PUT    /api/reviews/:id            DELETE /api/reviews/:id

GET    /api/users                  POST /api/users
PUT    /api/users/:id              DELETE /api/users/:id
GET    /api/users/audit/log

GET    /api/analytics/overview     GET  /api/analytics/downloads
GET    /api/analytics/countries    GET  /api/analytics/products
GET    /api/analytics/sources

GET    /api/settings               PUT  /api/settings/:key
POST   /api/uploads                DELETE /api/uploads?url=…
POST   /api/events/view

GET    /robots.txt                 GET  /sitemap.xml
```

Диапазон дат в аналитике: `?range=today|7d|30d|90d|12m|custom&from=&to=`.

## Page Builder

Каждая публичная страница это список JSON-блоков, которые можно менять
местами, дублировать, скрывать и удалять в разделе **Pages**:

`hero`, `text`, `stats`, `categories`, `featuredProducts`, `productGrid`,
`faq`, `cta`, `newsletter`, `customHtml`.

`customHtml` санитизируется перед выводом: скрипты, обработчики событий и
`javascript:` ссылки вырезаются.

## База данных

Модели: `User`, `Category` (самоссылка для подкатегорий), `Product`, `Tag`,
`ProductTag`, `ProductImage`, `Page`, `PageBlock`, `Review`, `DownloadEvent`,
`ViewEvent`, `AuditLog`, `Country`, `Setting`.

```bash
npm run db:migrate:dev -- --name your_change   # новая миграция
npm run db:reset                               # пересоздать и засеять заново
```

## Аналитика и приватность

- каждое скачивание и просмотр пишутся как событие: страна, регион, город
  (только если их уже определил CDN), referrer, категория устройства;
- IP не хранится: он хешируется солью, которая меняется каждые сутки, и нужен
  только для антифрода и подсчёта уникальных посетителей;
- страна берётся из заголовка CDN (`CF-IPCountry`, `X-Vercel-IP-Country`),
  за прокси не забудьте прокинуть его.

## Storage

`STORAGE_DRIVER=local` пишет в `server/uploads` (для разработки).
`STORAGE_DRIVER=s3` работает с любым S3-совместимым хранилищем: подпись
SigV4 реализована напрямую, AWS SDK не нужен. Загрузка проверяет
magic-number файла, а не заявленный `Content-Type`, и ограничена
`UPLOAD_MAX_MB`.

## Безопасность

- пароли только в виде bcrypt-хеша, cookie `httpOnly` + `SameSite=Lax`;
- CSRF: double-submit токен, обязательный заголовок на любых изменениях;
- rate limiting: вход, скачивания, отзывы, загрузки, общий лимит API;
- helmet с CSP, CORS по списку разрешённых origin;
- валидация Zod на каждом входящем теле запроса;
- audit log всех административных изменений.

## SEO

- на каждый продукт: title, description, canonical, OpenGraph, Twitter card и
  JSON-LD `SoftwareApplication`; теги вставляются в `index.html` на сервере,
  поэтому краулеру не нужен JavaScript;
- `sitemap.xml` и `robots.txt` генерируются из базы.

## Что осталось на будущее

- полнотекстовый поиск PostgreSQL (`tsvector` + GIN) вместо `ILIKE`;
- карта мира в разделе Countries;
- реальная отправка формы подписки во внешний сервис (сейчас только UI);
- очередь для событий аналитики при высокой нагрузке.

## Важно

Это шаблон каталога. Перед публикацией замените demo-контент, изображения и
ссылки на реальные и легальные. Для инструментов, которые могут нарушать
правила сторонних сервисов или игр, добавьте собственные policy/age/safety
ограничения.
