# MASTER PROMPT — дальнейшая разработка ToolHub

Ты — senior full-stack engineer + product designer. Продолжай разработку проекта ToolHub из существующего React/Vite + Express starter.

## Цель

Создать production-ready каталог инструментов в стиле premium dark SaaS marketplace:

- Windows tools
- Game tools
- Roblox tools
- Crypto tools
- FAQ
- About
- Product detail pages
- полноценная Admin CMS

Сохрани текущую визуальную основу: #070b14 фон, панели #0d1420/#111a29, тонкие borders, purple gradient #8b5cf6 → #6332dc, аккуратные glow-эффекты, Inter, минималистичные карточки, высокая плотность информации.

## Frontend

Используй:
- React + TypeScript
- Vite
- React Router
- Tailwind или CSS modules, если это упростит поддержку
- Lucide icons
- TanStack Query для server state
- Zod для validation
- React Hook Form для CMS forms

Страницы:

1. `/`
2. `/windows`
3. `/game`
4. `/roblox`
5. `/crypto`
6. `/faq`
7. `/about`
8. `/product/:slug`
9. `/admin`
10. `/admin/products`
11. `/admin/products/new`
12. `/admin/products/:id/edit`
13. `/admin/categories`
14. `/admin/pages`
15. `/admin/reviews`
16. `/admin/users`
17. `/admin/analytics`
18. `/admin/settings`

## Product model

Product должен иметь минимум:

id
slug
name
categoryId
subcategoryId
shortDescription
longDescription
rating
reviewCount
downloads
views
version
fileSize
license
price
downloadUrl
officialUrl
thumbnail
gallery[]
screenshots[]
tags[]
featured
popular
verified
status
countryAvailability[]
createdAt
updatedAt
changelog[]
requirements[]
features[]
seoTitle
seoDescription
seoKeywords

## Admin CMS

Админ должен иметь возможность менять без правки кода:

- любое слово на Home
- hero title/subtitle
- CTA
- category titles
- footer
- FAQ
- About
- SEO metadata
- product name
- description
- rating
- review count
- downloads
- image
- gallery
- screenshots
- version
- size
- tags
- category
- country availability
- download URL
- official URL
- featured/popular/verified
- visibility/status

Добавь Page Builder на базе JSON blocks:

hero
text
stats
categories
featuredProducts
productGrid
faq
cta
newsletter
customHtml

Каждая страница должна состоять из блоков, которые можно reorder/edit/duplicate/delete.

## Backend

Перейти с JSON на PostgreSQL.

Предпочтительно:
- Prisma ORM
- PostgreSQL
- Express или NestJS

API:

GET /api/products
GET /api/products/:slug
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

GET /api/categories
POST /api/categories
PUT /api/categories/:id
DELETE /api/categories/:id

GET /api/pages/:slug
PUT /api/pages/:slug

GET /api/analytics/overview
GET /api/analytics/downloads
GET /api/analytics/countries
GET /api/analytics/products

POST /api/reviews
GET /api/reviews
PUT /api/reviews/:id
DELETE /api/reviews/:id

## Authentication

Добавить admin authentication:

- email/password
- secure password hashing
- session or JWT
- protected `/admin/*`
- logout
- rate limiting
- CSRF protection if cookie-based
- role-based access:
  - super_admin
  - editor
  - moderator
  - analyst

Никогда не хранить plaintext passwords.

## Analytics

Admin Dashboard должен показывать:

- total products
- total users
- total downloads
- total views
- average rating
- downloads today
- downloads this week
- downloads this month
- top products
- top categories
- countries
- traffic sources
- conversion/download rate

Графики:

- downloads over time
- views over time
- users over time
- downloads by category
- downloads by country
- top products
- new products
- review activity

Добавь date range:
Today
7 days
30 days
90 days
12 months
Custom

## Country analytics

Для каждого download/view event сохранять:

country
countryCode
region
city (если legally appropriate)
timestamp
productId
referrer
userAgent/device category

На dashboard:

country table
percentage
downloads
views
trend

Добавь карту позже, если будет полезно.

## Product detail UX

Product page должна иметь:

- breadcrumb
- large cover
- product title
- verified badge
- category
- rating
- review count
- downloads
- version
- file size
- updated date
- download button
- official website button
- screenshots gallery
- features
- requirements
- changelog
- reviews
- related products
- report button

Download button должен вести на backend endpoint:

GET /api/products/:id/download

Endpoint:
1. increment download count
2. create analytics event
3. return/redirect to configured download URL

Добавь anti-abuse rate limiting.

## Search

Добавить:

- global search
- autocomplete
- category filters
- tags
- rating
- free/premium
- popularity
- latest
- alphabetical

Позже заменить простой SQL search на PostgreSQL full-text search.

## SEO

Каждая product page должна иметь:

- title
- description
- canonical
- OpenGraph
- Twitter card
- JSON-LD Product/SoftwareApplication schema

Добавить sitemap.xml и robots.txt.

## Storage

Изображения не хранить в database.

Использовать S3-compatible storage:
- Cloudflare R2
или
- Supabase Storage

CMS должен поддерживать:
- upload
- replace
- delete
- reorder
- crop/preview

## Security

Обязательно:

- input validation
- output escaping
- rate limits
- admin auth
- secure headers
- CORS configuration
- file type validation
- upload size limits
- audit log
- no arbitrary HTML unless explicitly sanitized
- server-side permission checks

## Design rules

Не превращай UI в generic Bootstrap.

Сохрани:
- dark premium appearance
- restrained purple
- thin borders
- soft shadows
- subtle gradients
- 8–16px radius
- dense but readable cards
- responsive desktop/mobile
- consistent spacing
- skeleton loading
- empty states
- error states
- toast notifications
- confirmation modals

Не использовать чрезмерные animations.

## Admin UX

Sidebar:

Dashboard
Products
Categories
Pages
Reviews
Users
Downloads
Analytics
Countries
Settings

Dashboard cards должны быть clickable.

Products table:
- search
- category
- status
- sort
- bulk select
- bulk publish/unpublish
- bulk delete
- export CSV

Product editor:
- General
- Media
- SEO
- Analytics
- Links
- Changelog
- Requirements

Добавить autosave draft.

## Database

Создай Prisma schema для:

User
Role
Product
Category
Tag
ProductTag
ProductImage
Page
PageBlock
Review
DownloadEvent
ViewEvent
AuditLog
Country

Создай migrations + seed script.

Seed должен заполнить demo products.

## Quality

Перед завершением:

1. `npm run build`
2. проверить все routes
3. проверить mobile 375px
4. проверить desktop 1440px
5. проверить API validation
6. проверить admin permissions
7. проверить product CRUD
8. проверить image upload
9. проверить analytics
10. проверить download event
11. проверить SEO metadata
12. проверить no console errors

Не переписывай работающие компоненты без причины.

Сначала изучи существующую структуру проекта, затем делай изменения небольшими логическими этапами.

После каждого крупного этапа:
- кратко перечисли измененные файлы
- укажи новые API
- укажи migrations
- укажи как запустить
- укажи что осталось сделать

Не добавляй ненужные зависимости.
