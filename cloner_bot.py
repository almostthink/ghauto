"""
GitHub Public Repo Cloner Bot
==============================

Телеграм-бот, который принимает ссылку на ПУБЛИЧНЫЙ репозиторий GitHub,
скачивает его, вырезает чувствительные файлы (ключи, секреты, .env,
разную конфиденциальную конфигурацию и .gitignore) и упаковывает всё
обратно в ZIP с полным сохранением структуры папок.

Итоговый архив можно распаковать где угодно и залить в новый репозиторий
один-в-один по папкам и файлам.

Запуск:
    export TELEGRAM_TOKEN="123:ABC..."
    python cloner_bot.py

Зависимости:
    pip install python-telegram-bot==21.* requests
    (плюс в системе должен быть установлен git)
"""

import os
import re
import io
import shutil
import logging
import zipfile
import tempfile
import subprocess
import fnmatch
from urllib.parse import urlparse

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ========== КОНФИГ ==========
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN", "ВАШ_ТЕЛЕГРАМ_ТОКЕН")

# Максимальный размер репозитория, который отдаём в чат (Telegram лимит ~50 МБ).
MAX_ARCHIVE_BYTES = 48 * 1024 * 1024

# Глубина клонирования. 1 = только последний коммит (быстро и легко).
CLONE_DEPTH = 1

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# ========== ПРАВИЛА ФИЛЬТРАЦИИ ==========
# Что считаем чувствительным и НЕ кладём в итоговый архив.
# Сопоставление идёт по имени файла и по относительному пути (fnmatch).

# 1. Служебные папки, которые никогда не нужны при переносе.
EXCLUDE_DIRS = {
    ".git",
    ".github",          # workflow'ы часто содержат секреты/окружение
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".idea",
    ".vscode",
    ".terraform",
    ".mypy_cache",
    ".pytest_cache",
    "dist",
    "build",
}

# 2. Точные имена файлов (без учёта регистра), которые вырезаем.
EXCLUDE_EXACT = {
    ".gitignore",
    ".gitattributes",
    ".env",
    ".npmrc",
    ".netrc",
    ".dockercfg",
    "credentials",
    "credentials.json",
    "secrets.json",
    "secrets.yaml",
    "secrets.yml",
    "id_rsa",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
    "terraform.tfstate",
    "terraform.tfvars",
    ".htpasswd",
    "serviceaccount.json",
    "service-account.json",
}

# 3. Маски (glob), которыми ловим ключи, сертификаты, env-файлы, разную
#    конфиденциальную конфигурацию.
EXCLUDE_GLOBS = [
    "*.pem",
    "*.key",
    "*.pfx",
    "*.p12",
    "*.keystore",
    "*.jks",
    "*.crt",
    "*.cer",
    "*.der",
    "*.asc",
    "*.gpg",
    "*.ppk",
    ".env",
    ".env.*",
    "*.env",
    "*.secret",
    "*.secrets",
    "*secret*",
    "*credential*",
    "*password*",
    "*.tfvars",
    "*.tfstate",
    "*.tfstate.*",
    "id_rsa*",
    "id_dsa*",
    "id_ecdsa*",
    "id_ed25519*",
    "*.p8",
    "*.jwt",
    "*service*account*.json",
]

SENSITIVE_URL_HINTS = ("github.com",)


def is_sensitive(rel_path: str) -> bool:
    """Проверяет, относится ли файл к чувствительным (нужно исключить)."""
    name = os.path.basename(rel_path)
    lname = name.lower()
    lrel = rel_path.lower().replace("\\", "/")

    if lname in EXCLUDE_EXACT:
        return True

    for pattern in EXCLUDE_GLOBS:
        if fnmatch.fnmatch(lname, pattern) or fnmatch.fnmatch(lrel, pattern):
            return True

    return False


def parse_github_url(text: str):
    """
    Вытаскивает owner/repo из ссылки GitHub.
    Поддерживает https://github.com/owner/repo(.git)(/...), а также
    голый вид owner/repo.
    Возвращает (owner, repo, clone_url) или None.
    """
    text = text.strip()

    # Голый вид owner/repo
    m = re.fullmatch(r"([\w.-]+)/([\w.-]+?)(?:\.git)?", text)
    if m:
        owner, repo = m.group(1), m.group(2)
        return owner, repo, f"https://github.com/{owner}/{repo}.git"

    parsed = urlparse(text)
    host = parsed.netloc.lower()
    if host not in ("github.com", "www.github.com"):
        return None

    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        return None

    owner = parts[0]
    repo = parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]

    if not owner or not repo:
        return None

    return owner, repo, f"https://github.com/{owner}/{repo}.git"


def clone_repo(clone_url: str, dest_dir: str) -> None:
    """
    Клонирует публичный репозиторий. Без учётных данных, поэтому приватные
    репозитории тут работать не будут (и не должны — бот только для публичных).
    """
    env = dict(os.environ)
    # Запрещаем git спрашивать логин/пароль в терминале.
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GCM_INTERACTIVE"] = "never"

    cmd = [
        "git",
        "clone",
        "--depth",
        str(CLONE_DEPTH),
        "--single-branch",
        clone_url,
        dest_dir,
    ]
    result = subprocess.run(
        cmd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stdout.strip() or "git clone не удался")


def build_clean_zip(src_dir: str, repo_name: str):
    """
    Обходит дерево репозитория, пропуская чувствительные файлы и служебные
    папки, и собирает ZIP в памяти с сохранением структуры.

    Корнем внутри архива будет папка repo_name/, чтобы при распаковке
    получалась ровно та же структура, что в репозитории.

    Возвращает (BytesIO, kept_count, skipped_list).
    """
    buf = io.BytesIO()
    kept = 0
    skipped = []

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(src_dir):
            # Отрезаем служебные папки на месте, чтобы не заходить внутрь.
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for fname in files:
                abs_path = os.path.join(root, fname)
                rel_path = os.path.relpath(abs_path, src_dir)

                if is_sensitive(rel_path):
                    skipped.append(rel_path.replace("\\", "/"))
                    continue

                # Пропускаем симлинки (могут указывать наружу).
                if os.path.islink(abs_path):
                    skipped.append(rel_path.replace("\\", "/") + " (симлинк)")
                    continue

                arcname = os.path.join(repo_name, rel_path)
                zf.write(abs_path, arcname)
                kept += 1

    buf.seek(0)
    return buf, kept, skipped


# ========== ОБРАБОТЧИКИ TELEGRAM ==========

START_TEXT = (
    "Привет 👋\n\n"
    "Я клонирую ПУБЛИЧНЫЕ репозитории GitHub и отдаю тебе ZIP с полной "
    "структурой папок... готовый, чтобы залить в новый репозиторий как есть.\n\n"
    "Перед упаковкой я вырезаю чувствительное:\n"
    "• ключи и сертификаты (.pem, .key, id_rsa, .p12 ...)\n"
    "• .env и подобные файлы с секретами\n"
    "• .gitignore, .gitattributes и служебные .git/.github\n"
    "• разную конфиденциальную конфигурацию (credentials, secrets, tfstate ...)\n\n"
    "Просто пришли ссылку, например:\n"
    "https://github.com/psf/requests"
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(START_TEXT)


async def handle_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    parsed = parse_github_url(text)

    if not parsed:
        await update.message.reply_text(
            "Это не похоже на ссылку GitHub. Пришли что-то вроде "
            "https://github.com/owner/repo"
        )
        return

    owner, repo, clone_url = parsed
    status = await update.message.reply_text(f"Клонирую {owner}/{repo} ...")

    workdir = tempfile.mkdtemp(prefix="ghclone_")
    repo_dir = os.path.join(workdir, repo)

    try:
        try:
            clone_repo(clone_url, repo_dir)
        except Exception as e:
            msg = str(e)
            hint = ""
            if "Authentication failed" in msg or "could not read" in msg.lower():
                hint = (
                    "\n\nПохоже, репозиторий приватный или не существует. "
                    "Я умею только публичные."
                )
            await status.edit_text(f"Не удалось склонировать репозиторий.{hint}")
            logger.warning("clone failed for %s/%s: %s", owner, repo, msg)
            return

        await status.edit_text("Собираю архив и вырезаю чувствительные файлы ...")

        zip_buf, kept, skipped = build_clean_zip(repo_dir, repo)
        size = zip_buf.getbuffer().nbytes

        if kept == 0:
            await status.edit_text("После фильтрации не осталось ни одного файла.")
            return

        if size > MAX_ARCHIVE_BYTES:
            await status.edit_text(
                f"Архив слишком большой для Telegram "
                f"({size // (1024 * 1024)} МБ, лимит ~48 МБ). "
                "Такой репозиторий лучше клонировать локально."
            )
            return

        # Короткая сводка по вырезанному.
        if skipped:
            preview = "\n".join(f"  - {p}" for p in skipped[:15])
            more = f"\n  ... и ещё {len(skipped) - 15}" if len(skipped) > 15 else ""
            summary = (
                f"Готово ✅\n"
                f"Файлов в архиве: {kept}\n"
                f"Вырезано чувствительных: {len(skipped)}\n\n"
                f"Вырезаны:\n{preview}{more}"
            )
        else:
            summary = (
                f"Готово ✅\n"
                f"Файлов в архиве: {kept}\n"
                f"Чувствительных файлов не нашлось."
            )

        await status.edit_text(summary)

        zip_buf.seek(0)
        await update.message.reply_document(
            document=zip_buf,
            filename=f"{repo}.zip",
            caption=(
                f"{owner}/{repo} ... распакуй и структура папок будет "
                "ровно как в репозитории."
            ),
        )

    finally:
        shutil.rmtree(workdir, ignore_errors=True)


# ========== MAIN ==========

def main():
    if TELEGRAM_TOKEN == "ВАШ_ТЕЛЕГРАМ_ТОКЕН":
        logger.warning(
            "TELEGRAM_TOKEN не задан. Установите переменную окружения TELEGRAM_TOKEN."
        )

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_link))

    logger.info("Бот запущен. Отправьте /start в Telegram.")
    app.run_polling()


if __name__ == "__main__":
    main()
