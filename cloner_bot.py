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
import requests
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

# GitHub Personal Access Token с правом "repo" (создание репозитория + push).
# Можно задать глобально через переменную окружения, либо каждый пользователь
# задаёт свой командой /settoken в личке с ботом.
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

# Новые репозитории по умолчанию приватные (безопаснее).
DEFAULT_NEW_REPO_PRIVATE = True

# Токены GitHub, заданные пользователями в рантайме: {chat_id: token}.
chat_tokens = {}

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


def clone_repo(clone_url: str, dest_dir: str, full_history: bool = False) -> None:
    """
    Клонирует публичный репозиторий. Без учётных данных, поэтому приватные
    репозитории тут работать не будут (и не должны — бот только для публичных).

    full_history=True клонирует всю историю ветки (нужно для режима
    keephistory), иначе берётся только последний коммит (--depth).
    """
    env = dict(os.environ)
    # Запрещаем git спрашивать логин/пароль в терминале.
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GCM_INTERACTIVE"] = "never"

    cmd = ["git", "clone", "--single-branch"]
    if not full_history:
        cmd += ["--depth", str(CLONE_DEPTH)]
    cmd += [clone_url, dest_dir]
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


# ========== ЗАЛИВКА В НОВЫЙ РЕПОЗИТОРИЙ GITHUB ==========

def _scrub(text: str, *secrets: str) -> str:
    """Убирает токены из текста, чтобы не светить их в чате/логах."""
    out = text or ""
    for s in secrets:
        if s:
            out = out.replace(s, "***")
    return out


def prune_tree(src_dir: str):
    """
    Физически удаляет из рабочего дерева служебные папки (в т.ч. .git),
    чувствительные файлы и симлинки. Возвращает список вырезанного.

    Удаление .git обязательно: иначе вырезанные ключи остались бы в истории
    коммитов и утекли бы при пуше.
    """
    skipped = []

    # 1. Удаляем служебные папки на любой глубине (снизу вверх).
    for root, dirs, _files in os.walk(src_dir, topdown=False):
        for d in list(dirs):
            if d in EXCLUDE_DIRS:
                shutil.rmtree(os.path.join(root, d), ignore_errors=True)

    # 2. Удаляем чувствительные файлы и симлинки.
    for root, _dirs, files in os.walk(src_dir):
        for fname in files:
            abs_path = os.path.join(root, fname)
            rel = os.path.relpath(abs_path, src_dir).replace("\\", "/")
            try:
                if os.path.islink(abs_path):
                    os.remove(abs_path)
                    skipped.append(rel + " (симлинк)")
                elif is_sensitive(rel):
                    os.remove(abs_path)
                    skipped.append(rel)
            except OSError:
                pass

    return skipped


def gh_create_repo(token: str, name: str, private: bool):
    """Создаёт новый репозиторий на аккаунте владельца токена."""
    resp = requests.post(
        "https://api.github.com/user/repos",
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
        },
        json={"name": name, "private": private, "auto_init": False},
        timeout=30,
    )
    if resp.status_code == 201:
        return resp.json()

    if resp.status_code == 401:
        raise RuntimeError("Токен GitHub недействителен (401).")
    if resp.status_code == 403:
        raise RuntimeError("Нет прав для создания репозитория (403).")
    if resp.status_code == 422:
        raise RuntimeError(
            f"Репозиторий с именем '{name}' уже существует. "
            "Укажите другое имя: /push <ссылка> <новое_имя>"
        )
    try:
        detail = resp.json().get("message", "")
    except Exception:
        detail = ""
    raise RuntimeError(f"GitHub вернул {resp.status_code}. {detail}".strip())


def _run_git(args, cwd, token=""):
    """Запускает git, скрывая токен в выводе при ошибке."""
    env = dict(os.environ)
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GCM_INTERACTIVE"] = "never"
    result = subprocess.run(
        ["git"] + args,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(_scrub(result.stdout.strip(), token) or "git ошибка")
    return result.stdout


def push_cleaned_repo(src_dir: str, token: str, new_name: str, private: bool):
    """
    Заводит свежую git-историю в очищенном дереве, создаёт новый репозиторий
    и пушит туда содержимое. Возвращает (html_url, full_name).
    """
    # Свежая история, одна чистая ревизия.
    _run_git(["init", "-q"], cwd=src_dir)
    _run_git(["add", "-A"], cwd=src_dir)
    _run_git(
        [
            "-c", "user.email=cloner-bot@local",
            "-c", "user.name=GitHub Cloner Bot",
            "commit", "-q", "-m", "Initial clean import (sensitive files removed)",
        ],
        cwd=src_dir,
    )
    _run_git(["branch", "-M", "main"], cwd=src_dir)

    repo = gh_create_repo(token, new_name, private)
    full_name = repo["full_name"]
    html_url = repo["html_url"]

    # В remote подставляем токен, но наружу его не показываем.
    push_url = f"https://{token}@github.com/{full_name}.git"
    _run_git(["remote", "add", "origin", push_url], cwd=src_dir, token=token)
    _run_git(["push", "-u", "origin", "main"], cwd=src_dir, token=token)

    return html_url, full_name


# ========== РЕЖИМ С СОХРАНЕНИЕМ ИСТОРИИ (keephistory) ==========

def history_rewrite_available() -> bool:
    """Проверяет, установлен ли git-filter-repo (нужен для keephistory)."""
    try:
        r = subprocess.run(
            ["git", "filter-repo", "--version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=20,
        )
        return r.returncode == 0
    except Exception:
        return False


def _build_filename_callback() -> str:
    """
    Собирает тело --filename-callback для git-filter-repo из тех же правил,
    что используются для ZIP. Файл удаляется из ВСЕХ коммитов, если он
    лежит в служебной папке, совпадает с точным именем или подходит под маску.
    """
    return (
        "import fnmatch\n"
        f"_DIRS = {EXCLUDE_DIRS!r}\n"
        f"_EXACT = {EXCLUDE_EXACT!r}\n"
        f"_GLOBS = {EXCLUDE_GLOBS!r}\n"
        "p = filename.decode('utf-8', 'surrogateescape')\n"
        "parts = p.split('/')\n"
        "if any(seg in _DIRS for seg in parts[:-1]):\n"
        "    return None\n"
        "name = parts[-1].lower()\n"
        "pl = p.lower()\n"
        "if name in _EXACT:\n"
        "    return None\n"
        "for pat in _GLOBS:\n"
        "    if fnmatch.fnmatch(name, pat) or fnmatch.fnmatch(pl, pat):\n"
        "        return None\n"
        "return filename\n"
    )


def rewrite_history_strip_sensitive(repo_dir: str) -> None:
    """
    Переписывает всю историю ветки, вырезая чувствительные файлы из каждого
    коммита. Сообщения, авторы и даты коммитов сохраняются; коммиты, которые
    после чистки стали пустыми, схлопываются. SHA коммитов меняются (это
    неизбежно при переписывании истории).
    """
    cb = _build_filename_callback()
    _run_git(["filter-repo", "--force", "--filename-callback", cb], cwd=repo_dir)


def push_with_history(src_dir: str, token: str, new_name: str, private: bool):
    """
    Создаёт новый репозиторий и пушит в него уже переписанную историю.
    git-filter-repo удаляет origin, поэтому добавляем свой заново.
    Возвращает (html_url, full_name, branch).
    """
    repo = gh_create_repo(token, new_name, private)
    full_name = repo["full_name"]
    html_url = repo["html_url"]

    branch = _run_git(["symbolic-ref", "--short", "HEAD"], cwd=src_dir).strip()
    if not branch:
        branch = "main"

    push_url = f"https://{token}@github.com/{full_name}.git"
    _run_git(["remote", "add", "origin", push_url], cwd=src_dir, token=token)
    _run_git(["push", "-u", "origin", branch], cwd=src_dir, token=token)
    # Теги, если есть.
    try:
        _run_git(["push", "origin", "--tags"], cwd=src_dir, token=token)
    except Exception:
        pass

    return html_url, full_name, branch


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
    "https://github.com/psf/requests\n\n"
    "А ещё я могу сразу залить очищенный репозиторий в НОВЫЙ репозиторий на "
    "твоём GitHub (без секретов и без старой истории коммитов):\n"
    "1) один раз пришли токен:  /settoken <твой_PAT>\n"
    "   (PAT с правом repo, лучше в личке ... я удалю сообщение с токеном)\n"
    "2) залей:  /push <ссылка> [имя_нового_репо] [public|private] [keephistory]\n\n"
    "По умолчанию новый репозиторий приватный и заливается одним чистым "
    "коммитом. Добавь keephistory, чтобы сохранить всю историю коммитов "
    "(секреты при этом вырезаются из всех коммитов)."
)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(START_TEXT)


async def settoken(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    if not context.args:
        await update.message.reply_text(
            "Использование: /settoken <GitHub_Personal_Access_Token>\n"
            "Токен с правом 'repo'. Лучше писать в личке боту."
        )
        return

    token = context.args[0].strip()
    chat_tokens[chat_id] = token

    # Пытаемся удалить сообщение с токеном, чтобы оно не висело в чате.
    try:
        await update.message.delete()
    except Exception:
        pass

    # Проверяем токен и показываем, под каким аккаунтом будем создавать репо.
    try:
        r = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {token}"},
            timeout=20,
        )
        if r.status_code == 200:
            login = r.json().get("login", "?")
            await context.bot.send_message(
                chat_id,
                f"Токен сохранён ✅ Новые репозитории будут создаваться "
                f"на аккаунте @{login}.",
            )
        else:
            await context.bot.send_message(
                chat_id,
                f"Токен сохранён, но проверка вернула {r.status_code}. "
                "Убедись, что у токена есть право 'repo'.",
            )
    except Exception:
        await context.bot.send_message(
            chat_id, "Токен сохранён. Проверить аккаунт сейчас не удалось."
        )


def _resolve_token(chat_id: int) -> str:
    return chat_tokens.get(chat_id) or GITHUB_TOKEN


async def push_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    token = _resolve_token(chat_id)

    if not token:
        await update.message.reply_text(
            "Сначала задай токен GitHub: /settoken <PAT> (с правом 'repo')."
        )
        return

    if not context.args:
        await update.message.reply_text(
            "Использование: /push <ссылка на репозиторий> [имя_нового_репо] "
            "[public|private] [keephistory]"
        )
        return

    url = context.args[0]
    rest = context.args[1:]

    private = DEFAULT_NEW_REPO_PRIVATE
    keep_history = False
    name = None
    for a in rest:
        low = a.lower()
        if low == "public":
            private = False
        elif low == "private":
            private = True
        elif low == "keephistory":
            keep_history = True
        elif name is None:
            name = a

    parsed = parse_github_url(url)
    if not parsed:
        await update.message.reply_text("Не похоже на ссылку GitHub.")
        return

    owner, repo, clone_url = parsed
    if not name:
        name = repo

    if keep_history and not history_rewrite_available():
        await update.message.reply_text(
            "Режим keephistory требует git-filter-repo. Установите его:\n"
            "pip install git-filter-repo"
        )
        return

    mode = "с сохранением истории" if keep_history else "одним чистым коммитом"
    status = await update.message.reply_text(
        f"Клонирую {owner}/{repo} и готовлю заливку в '{name}' ({mode}) ..."
    )

    workdir = tempfile.mkdtemp(prefix="ghpush_")
    repo_dir = os.path.join(workdir, repo)

    try:
        try:
            clone_repo(clone_url, repo_dir, full_history=keep_history)
        except Exception as e:
            await status.edit_text(
                f"Не удалось склонировать (возможно, приватный или не существует):\n"
                f"{_scrub(str(e), token)}"
            )
            return

        vis = "приватный" if private else "публичный"

        if keep_history:
            await status.edit_text(
                "Вырезаю чувствительные файлы из всей истории коммитов ..."
            )
            try:
                rewrite_history_strip_sensitive(repo_dir)
            except Exception as e:
                await status.edit_text(
                    f"Ошибка при чистке истории:\n{_scrub(str(e), token)}"
                )
                return

            await status.edit_text(f"Создаю репозиторий '{name}' и пушу историю ...")
            try:
                html_url, full_name, branch = push_with_history(
                    repo_dir, token, name, private
                )
            except Exception as e:
                await status.edit_text(f"Ошибка заливки:\n{_scrub(str(e), token)}")
                return

            await status.edit_text(
                f"Готово ✅ {vis} репозиторий создан, история сохранена "
                f"(ветка {branch}), чувствительные файлы вырезаны из всех "
                f"коммитов:\n{html_url}"
            )
            return

        # Обычный режим: одна чистая ревизия без старой истории.
        await status.edit_text("Вырезаю чувствительные файлы и старую историю ...")
        skipped = prune_tree(repo_dir)

        await status.edit_text(f"Создаю репозиторий '{name}' и пушу ...")
        try:
            html_url, full_name = push_cleaned_repo(repo_dir, token, name, private)
        except Exception as e:
            await status.edit_text(f"Ошибка заливки:\n{_scrub(str(e), token)}")
            return

        tail = ""
        if skipped:
            tail = f"\nВырезано чувствительных файлов: {len(skipped)}"
        await status.edit_text(
            f"Готово ✅ {vis} репозиторий создан и залит:\n{html_url}{tail}"
        )

    finally:
        shutil.rmtree(workdir, ignore_errors=True)


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
    app.add_handler(CommandHandler("settoken", settoken))
    app.add_handler(CommandHandler("push", push_cmd))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_link))

    logger.info("Бот запущен. Отправьте /start в Telegram.")
    app.run_polling()


if __name__ == "__main__":
    main()
