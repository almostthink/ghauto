# GitHub Public Repo Cloner Bot

Телеграм-бот: принимает ссылку на **публичный** репозиторий GitHub,
скачивает его, вырезает чувствительные файлы и отдаёт ZIP с полной
структурой папок, готовый для заливки в новый репозиторий как есть.

## Что вырезается

- Ключи и сертификаты: `*.pem`, `*.key`, `*.p12`, `id_rsa*`, `*.jks` и т.п.
- Файлы окружения с секретами: `.env`, `.env.*`, `*.env`
- `.gitignore`, `.gitattributes` и служебные папки `.git/`, `.github/`
- Разная конфиденциальная конфигурация: `credentials*`, `*secret*`,
  `*.tfstate`, `*.tfvars`, `service-account.json` и т.п.
- Мусорные каталоги: `node_modules/`, `venv/`, `__pycache__/`, `dist/` ...

Правила заданы в `cloner_bot.py` (`EXCLUDE_DIRS`, `EXCLUDE_EXACT`,
`EXCLUDE_GLOBS`) ... легко расширяются.

## Запуск

```bash
pip install -r requirements.txt   # нужен также установленный git
export TELEGRAM_TOKEN="123:ABC..."
python cloner_bot.py
```

Затем в Telegram: `/start`, пришлите ссылку вида
`https://github.com/owner/repo` ... в ответ придёт `repo.zip`.

Бот работает только с публичными репозиториями: учётные данные не
используются, приватные клонировать не будет.
