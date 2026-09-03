# ToolHub — dark catalog starter

Готовый starter для каталога Windows / Game / Roblox / Crypto с минимальным backend.

## Стек
- React + Vite
- React Router
- Express
- JSON-файл вместо базы данных
- Lucide icons
- Responsive dark UI

## Запуск

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:4000

Для production:

```bash
npm run build
npm start
```

## Что уже работает

- Home
- Windows / Game / Roblox / Crypto каталоги
- FAQ accordion
- About
- Product detail page
- поиск и сортировка каталога
- Admin Dashboard
- график downloads
- страны
- KPI
- Products CMS
- создание / редактирование продуктов
- сохранение продуктов в `server/data.json`

## Важно

Это UI/демо-шаблон. Перед публикацией нужно заменить demo-контент, изображения и ссылки на реальные, легальные продукты. Для инструментов, которые могут нарушать правила сторонних сервисов или игр, добавьте собственные policy/age/safety ограничения.

## Следующий этап

Заменить JSON на PostgreSQL/Supabase, добавить авторизацию админа, storage для изображений, полноценный CMS текстов/страниц, real analytics, роли пользователей, audit log и server-side validation.

## Admin redesign
Админка обновлена под отдельный premium analytics dashboard из референса: sidebar, KPI cards, downloads chart, countries, top tools, recent reviews, quick actions, activity log и system information. Публичный сайт не изменялся.
