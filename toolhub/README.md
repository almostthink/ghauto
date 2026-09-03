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

## Деплой на сервер

Ниже полный путь для чистого Ubuntu 22.04/24.04 с nginx и systemd. Домен в
примерах `example.com`, каталог приложения `/opt/toolhub`, файлы продуктов и
картинки вынесены в `/var/lib/toolhub`, чтобы деплой их не затирал.

### 1. Пакеты

```bash
sudo apt update
sudo apt install -y curl git nginx postgresql
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. База данных

```bash
sudo -u postgres psql -c "CREATE USER toolhub WITH PASSWORD 'СИЛЬНЫЙ_ПАРОЛЬ';"
sudo -u postgres psql -c "CREATE DATABASE toolhub OWNER toolhub;"
```

### 3. Пользователь и каталоги

```bash
sudo useradd --system --home /opt/toolhub --shell /usr/sbin/nologin toolhub
sudo mkdir -p /opt/toolhub /var/lib/toolhub/products /var/lib/toolhub/uploads
sudo chown -R toolhub:toolhub /opt/toolhub /var/lib/toolhub
```

### 4. Код и сборка

```bash
sudo -u toolhub git clone https://github.com/<owner>/<repo>.git /opt/toolhub/src
cd /opt/toolhub/src/toolhub
sudo -u toolhub npm ci
sudo -u toolhub cp .env.example .env
sudo -u toolhub nano .env          # см. пункт 5
sudo -u toolhub npx prisma generate
sudo -u toolhub npm run db:migrate  # prisma migrate deploy
sudo -u toolhub npm run db:seed     # только при первой установке
sudo -u toolhub VITE_ADMIN_PATH=/p-7f3a91 npm run build
```

`VITE_ADMIN_PATH` подставляется на этапе сборки, поэтому путь к панели попадает
в бандл. Он должен совпадать с `ADMIN_PATH` в `.env`, иначе `robots.txt` будет
закрывать не тот адрес.

### 5. Переменные окружения

```ini
DATABASE_URL="postgresql://toolhub:СИЛЬНЫЙ_ПАРОЛЬ@localhost:5432/toolhub?schema=public"
NODE_ENV=production
PORT=4000
PUBLIC_SITE_URL="https://example.com"
CORS_ORIGINS="https://example.com"

# 64 случайных символа: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="..."
SESSION_TTL_HOURS=12
COOKIE_SECURE=1

ADMIN_PATH=/p-7f3a91

PRODUCTS_DIR=/var/lib/toolhub/products
PRODUCT_FILE_MAX_MB=512
STORAGE_DRIVER=local
UPLOADS_DIR=/var/lib/toolhub/uploads

SEED_ADMIN_EMAIL="you@example.com"
SEED_ADMIN_PASSWORD="временный-пароль-смените-после-входа"
```

`PRODUCTS_DIR` и `UPLOADS_DIR` должны лежать вне каталога с кодом: systemd-юнит
ниже монтирует файловую систему только для чтения и разрешает запись лишь в
`/var/lib/toolhub`.

`COOKIE_SECURE=1` обязателен под HTTPS, иначе браузер не сохранит cookie
сессии. В production сервер не стартует, если `JWT_SECRET` короче 32 символов.

Если картинки хотите хранить в S3/R2, а не на диске, поставьте
`STORAGE_DRIVER=s3` и заполните блок `S3_*`.

### 6. systemd

`/etc/systemd/system/toolhub.service`:

```ini
[Unit]
Description=ToolHub
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=toolhub
WorkingDirectory=/opt/toolhub/src/toolhub
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

# песочница: приложению нужен только свой каталог и папка с файлами
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/toolhub

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now toolhub
sudo systemctl status toolhub
journalctl -u toolhub -f
```

### 7. nginx и сертификат

В `deploy/` лежат два готовых конфига, выберите один.

**Вариант А, домен уже за Cloudflare (рекомендуется).** Сертификат берётся
прямо в Cloudflare, он действует 15 лет, не требует продления, и прокси
(оранжевое облако) не нужно выключать.

1. В панели: **SSL/TLS → Origin Server → Create Certificate**, оставьте
   RSA и список хостов `example.com, *.example.com`, срок 15 лет. Cloudflare
   покажет два блока текста, оба нужны один раз, потом закроются навсегда.
2. На сервере сохраните их:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/origin.pem     # вставить Origin Certificate
sudo nano /etc/ssl/cloudflare/origin.key     # вставить Private Key
sudo chmod 600 /etc/ssl/cloudflare/origin.key
sudo chmod 644 /etc/ssl/cloudflare/origin.pem
```

3. Конфиг и диапазоны Cloudflare:

```bash
sudo cp /opt/toolhub/src/toolhub/deploy/nginx-toolhub-cloudflare.conf /etc/nginx/sites-available/toolhub
sudo sed -i 's/example\.com/ВАШ-ДОМЕН.com/g' /etc/nginx/sites-available/toolhub
sudo ln -sf /etc/nginx/sites-available/toolhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo /opt/toolhub/src/toolhub/deploy/cloudflare-ips.sh
sudo nginx -t && sudo systemctl reload nginx
```

4. В панели **SSL/TLS → Overview → Full (strict)** и включите `TRUST_CLOUDFLARE=1`
   в `.env`, затем `sudo systemctl restart toolhub`.

**Вариант Б, без Cloudflare.** Обычный Let's Encrypt:

```bash
sudo cp /opt/toolhub/src/toolhub/deploy/nginx-toolhub.conf /etc/nginx/sites-available/toolhub
sudo sed -i 's/example\.com/ВАШ-ДОМЕН.com/g' /etc/nginx/sites-available/toolhub
sudo sed -i '/cloudflare-ips.conf/d; /real_ip_header CF-Connecting-IP/d' /etc/nginx/sites-available/toolhub
sudo ln -sf /etc/nginx/sites-available/toolhub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ВАШ-ДОМЕН.com -d www.ВАШ-ДОМЕН.com
```

Если домен при этом всё же проксируется Cloudflare, на время выпуска
сертификата переключите запись на серое облако, иначе проверка не пройдёт.

Приложение доверяет одному прокси (`trust proxy = 1`), поэтому rate limit
считает реальные IP. Подробности про Cloudflare в разделе ниже.

### 8. Первый вход

Откройте `https://example.com/p-7f3a91`, войдите с сидовыми данными и сразу
смените пароль в **Settings → Password**.

### 9. Обновление

```bash
cd /opt/toolhub/src
sudo -u toolhub git pull
cd toolhub
sudo -u toolhub npm ci
sudo -u toolhub npm run db:migrate
sudo -u toolhub VITE_ADMIN_PATH=/p-7f3a91 npm run build
sudo systemctl restart toolhub
```

### 10. Резервные копии

```bash
# база
sudo -u postgres pg_dump toolhub | gzip > /var/backups/toolhub-$(date +%F).sql.gz
# файлы продуктов и картинки
tar czf /var/backups/toolhub-files-$(date +%F).tar.gz /var/lib/toolhub
```

Поставьте это в cron: база и `/var/lib/toolhub` это всё состояние, каталог с
кодом восстанавливается из git.

### Проверка после деплоя

```bash
curl -s https://example.com/api/health     # {"status":"ok","database":"up"}
curl -s https://example.com/robots.txt     # Disallow должен указывать на ваш ADMIN_PATH
curl -sI https://example.com/sitemap.xml
```

## Cloudflare: защита от ботов

Порядок такой: сначала закрываем origin, потом включаем фильтры на краю, потом
ставим Turnstile на формы. Домен в примерах `example.com`.

### Шаг 1. Домен в Cloudflare

1. Add site, выберите домен, план Free подходит.
2. Пропишите у регистратора NS-серверы, которые выдаст Cloudflare.
3. В **DNS** запись `A example.com` → IP сервера, **Proxy status: Proxied**
   (оранжевое облако). То же для `www`. Серое облако означает, что трафик идёт
   мимо Cloudflare и защита не работает.
4. **SSL/TLS → Overview → Full (strict)**. Сертификат на сервере уже есть от
   certbot, этого достаточно.
5. **SSL/TLS → Edge Certificates**: Always Use HTTPS — On, Minimum TLS 1.2.

### Шаг 2. Реальные IP посетителей

Без этого шага все посетители выглядят как несколько IP Cloudflare, и любой
rate limit блокирует всех сразу.

```bash
# конфиг с Origin Certificate, если ещё не поставили его на шаге 7 деплоя
sudo cp /opt/toolhub/src/toolhub/deploy/nginx-toolhub-cloudflare.conf /etc/nginx/sites-available/toolhub
sudo sed -i 's/example\.com/ВАШ-ДОМЕН.com/g' /etc/nginx/sites-available/toolhub
sudo /opt/toolhub/src/toolhub/deploy/cloudflare-ips.sh
```

Скрипт скачивает актуальные диапазоны Cloudflare, кладёт их в
`/etc/nginx/cloudflare-ips.conf` и перезагружает nginx. Раз в месяц по cron:

```bash
sudo crontab -e
# 0 4 1 * * /opt/toolhub/src/toolhub/deploy/cloudflare-ips.sh --ufw >/dev/null
```

В `.env` включите доверие к заголовку края:

```ini
TRUST_CLOUDFLARE=1
```

Только с этим флагом сервер читает адрес из `CF-Connecting-IP`. Флаг нельзя
включать, если origin доступен из интернета напрямую: тогда заголовок сможет
подделать кто угодно и обойти лимиты.

### Шаг 3. Закрыть origin от прямого доступа

Пока сервер отвечает по своему IP, злоумышленник обходит Cloudflare целиком.

```bash
sudo ufw allow OpenSSH
sudo /opt/toolhub/src/toolhub/deploy/cloudflare-ips.sh --ufw
sudo ufw enable
sudo ufw status                     # 80/443 только с диапазонов Cloudflare
```

Проверка: `curl -I --resolve example.com:443:<IP-сервера> https://example.com`
должен таймаутиться, а обычный `curl -I https://example.com` работать.

### Шаг 4. Фильтры Cloudflare

**Security → Bots**: Bot Fight Mode — On (на Free). На платных планах Super Bot
Fight Mode: Definitely automated — Block, Likely automated — Managed Challenge,
Verified bots — Allow, чтобы не потерять Googlebot.

**Security → WAF → Custom rules**, создайте по порядку:

| Правило | Выражение | Действие |
| --- | --- | --- |
| Admin panel | `(http.request.uri.path contains "/p-7f3a91")` | Managed Challenge |
| Block bad methods | `(not http.request.method in {"GET" "HEAD" "POST" "PUT" "DELETE" "OPTIONS"})` | Block |
| Protect write API | `(http.request.uri.path contains "/api/" and http.request.method in {"POST" "PUT" "DELETE"} and cf.threat_score gt 14)` | Managed Challenge |

Путь в первом правиле должен совпадать с вашим `ADMIN_PATH`.

**Security → WAF → Rate limiting rules**:

| Правило | Выражение | Лимит | Действие |
| --- | --- | --- | --- |
| Downloads | `http.request.uri.path contains "/download"` | 30 запросов за 1 мин с IP | Block на 10 мин |
| Reviews | `http.request.uri.path eq "/api/reviews" and http.request.method eq "POST"` | 5 за 10 мин с IP | Managed Challenge |
| Login | `http.request.uri.path eq "/api/auth/login"` | 10 за 10 мин с IP | Block на 1 час |

Это второй рубеж: свои лимиты в приложении остаются на случай, если запрос
всё же дойдёт до сервера.

**Caching → Cache Rules**: для `/api/*` поставьте Bypass cache, иначе счётчики
скачиваний и модерация будут отдавать закешированные ответы. Статику
(`/assets/*`) Cloudflare кеширует сама по заголовкам.

### Шаг 5. Turnstile на формах

Cloudflare фильтрует трафик, Turnstile закрывает конкретно формы: отзывы и вход
в админку.

1. **Turnstile → Add widget**, домен `example.com`, режим Managed.
2. Скопируйте Site Key и Secret Key в `.env`:

```ini
TURNSTILE_SITE_KEY="0x4AAAAAAA..."
TURNSTILE_SECRET_KEY="0x4AAAAAAA..."
TURNSTILE_PROTECT_REVIEWS=1
TURNSTILE_PROTECT_LOGIN=1
```

3. `sudo systemctl restart toolhub`.

Как это работает:

- без ключей проверка полностью выключена, приложение работает как раньше;
- с ключами виджет появляется в форме отзыва и на входе в админку, кнопка
  отправки недоступна, пока проверка не пройдена;
- сервер проверяет токен через siteverify **до** записи в базу, токен
  одноразовый, повторное использование отклоняется;
- если Cloudflare недоступен, запрос отклоняется, а не пропускается: сомнение
  трактуется не в пользу отправителя;
- CSP расширяется на `challenges.cloudflare.com` только когда проверка включена.

### Шаг 6. Дополнительно на админку

Самое надёжное для панели, доступной одному человеку, это **Zero Trust →
Access → Applications**: приложение с путём `example.com/p-7f3a91`, политика
Allow → Emails → ваш адрес. Cloudflare будет спрашивать одноразовый код по
почте ещё до того, как запрос дойдёт до сервера. Бесплатно до 50 пользователей.

### Проверка

```bash
# страна доезжает до аналитики
curl -s -H "CF-IPCountry: DE" https://example.com/api/products >/dev/null

# без токена отзыв не проходит, когда Turnstile включён
curl -s -X POST https://example.com/api/reviews \
  -H 'Content-Type: application/json' \
  -d '{"productId":"...","authorName":"test","rating":5,"body":"проверка проверка"}'
# {"error":"Bot check missing. Reload the page and try again."}

# в админке в разделе Countries появляются реальные страны, а не Unknown
```

Если после включения прокси в Cloudflare сайт отдаёт 521 или 522, значит ufw
уже закрыл порты, а диапазоны ещё не добавлены: запустите
`cloudflare-ips.sh --ufw` ещё раз.

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

## Администратор

В системе ровно один вход: аккаунт администратора панели. Сотрудников, ролей и
регистрации нет. Учётные данные создаются сидом из `SEED_ADMIN_EMAIL` и
`SEED_ADMIN_PASSWORD`, дальше имя, email и пароль меняются в разделе
**Settings → Administrator account**, без правки базы.

Сервер проверяет сессию на каждом запросе к админским эндпоинтам, интерфейс
ничего не решает сам по себе.

## API

```
GET    /api/health

POST   /api/auth/login             POST /api/auth/logout
GET    /api/auth/me                POST /api/auth/password
PUT    /api/auth/profile

GET    /api/products               GET  /api/products/suggest
GET    /api/products/:idOrSlug     GET  /api/products/:id/related
GET    /api/products/:id/download  (счётчик + событие + файл или redirect)
PUT    /api/products/:id/file      (загрузка установщика)
DELETE /api/products/:id/file
GET    /api/products/file/limits
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

GET    /api/audit

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

## Файлы продуктов

Установщики лежат на сервере в папке `PRODUCTS_DIR` (по умолчанию
`server/products`) и **не отдаются статикой**. Каждое скачивание идёт через
`GET /api/products/:id/download`, поэтому оно считается, попадает в аналитику,
ограничено rate limit и блокируется в запрещённых регионах.

Как это работает:

1. в редакторе продукта, вкладка **Links**, кнопка «Upload file»;
2. файл льётся потоком прямо на диск, в памяти целиком не оказывается, в
   интерфейсе виден прогресс;
3. на диске имя всегда UUID + расширение, оригинальное имя хранится отдельно и
   отдаётся в `Content-Disposition`, поэтому имя файла от клиента не может
   повлиять на путь;
4. если файл загружен, кнопка Download отдаёт его с сервера с поддержкой
   Range (докачка), если нет, посетителя редиректит на внешний `downloadUrl`;
5. замена файла удаляет старый, удаление продукта удаляет его установщик.

Разрешённые расширения: `exe, msi, msix, appx, zip, rar, 7z, tar, gz, tgz,
dmg, pkg, apk, deb, rpm, appimage, jar, iso, bin, run`. Лимит размера задаётся
`PRODUCT_FILE_MAX_MB` (по умолчанию 512).

На боевом сервере держите папку вне каталога с кодом, чтобы деплой её не
трогал, например `PRODUCTS_DIR=/var/lib/toolhub/products`.

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
- audit log всех административных изменений;
- Cloudflare Turnstile на отзывах и входе в админку (см. раздел выше), при
  недоступности проверки запрос отклоняется.

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
