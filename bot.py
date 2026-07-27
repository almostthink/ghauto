import logging
import time
import random
import asyncio
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters
)

# ========== КОНФИГ ==========
TELEGRAM_TOKEN = "ВАШ_ТЕЛЕГРАМ_ТОКЕН"
MAX_CONCURRENT_TOKENS = 2
MAX_CONCURRENT_CHANNEL_FETCH = 2
MAX_CONCURRENT_SENDS = 2
DELAY_MIN = 2.0
DELAY_MAX = 5.0
GLOBAL_REQUESTS_PER_SECOND = 3   # снижено для безопасности

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ========== ГЛОБАЛЬНЫЕ СОСТОЯНИЯ ==========
user_data_store = {}
running_tasks = {}
stop_flags = {}
progress = {}

# ========== RATE LIMITER (исправлен) ==========
class AsyncRateLimiter:
    def __init__(self, max_calls, period=1.0):
        self.max_calls = max_calls
        self.period = period
        self.semaphore = asyncio.Semaphore(max_calls)
        self.tokens = max_calls
        self.last_refill = None   # будет установлено при первом acquire

    async def acquire(self):
        async with self.semaphore:
            now = time.time()
            if self.last_refill is None:
                self.last_refill = now
            if now - self.last_refill >= self.period:
                self.tokens = self.max_calls
                self.last_refill = now
            while self.tokens <= 0:
                wait = self.period - (now - self.last_refill)
                if wait > 0:
                    await asyncio.sleep(wait)
                now = time.time()
                if now - self.last_refill >= self.period:
                    self.tokens = self.max_calls
                    self.last_refill = now
            self.tokens -= 1

# Глобальный лимитер (создаётся без обращения к event loop)
global_rate_limiter = AsyncRateLimiter(GLOBAL_REQUESTS_PER_SECOND, 1.0)

# ========== ФУНКЦИИ DISCORD ==========

def has_send_permission(permissions):
    return (permissions & 0x800) != 0

async def get_guilds_with_retry(token, max_retries=3):
    headers = {"Authorization": token}
    url = "https://discord.com/api/v9/users/@me/guilds"
    for attempt in range(max_retries):
        try:
            await global_rate_limiter.acquire()
            resp = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(url, headers=headers, timeout=15)
            )
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                try:
                    err = resp.json()
                    retry_after = err.get("retry_after", 0.5)
                except:
                    retry_after = 0.5
                logger.warning(f"429 при получении серверов, ждём {retry_after} сек")
                await asyncio.sleep(retry_after + 0.2)
                continue
            elif resp.status_code == 401:
                logger.warning(f"Токен ...{token[-12:]} невалиден")
                return None
            else:
                logger.error(f"Ошибка получения серверов: {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"Сетевая ошибка: {e}")
            await asyncio.sleep(1)
    logger.error(f"Не удалось получить сервера после {max_retries} попыток")
    return None

async def fetch_channels_for_guild_with_retry(token, guild_id, max_retries=3):
    headers = {"Authorization": token}
    url = f"https://discord.com/api/v9/guilds/{guild_id}/channels"
    for attempt in range(max_retries):
        try:
            await global_rate_limiter.acquire()
            resp = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: requests.get(url, headers=headers, timeout=15)
            )
            if resp.status_code == 200:
                channels = resp.json()
                text_channels = []
                for ch in channels:
                    if ch.get("type") in (0, 5):
                        perms = ch.get("permissions", 0)
                        if has_send_permission(perms):
                            text_channels.append(ch["id"])
                return text_channels
            elif resp.status_code == 429:
                try:
                    err = resp.json()
                    retry_after = err.get("retry_after", 0.5)
                except:
                    retry_after = 0.5
                logger.warning(f"429 при получении каналов {guild_id}, ждём {retry_after} сек")
                await asyncio.sleep(retry_after + 0.2)
                continue
            elif resp.status_code == 401:
                logger.warning(f"Токен ...{token[-12:]} невалиден при запросе каналов")
                return None
            else:
                logger.error(f"Ошибка каналов {guild_id}: {resp.status_code}")
                return []
        except Exception as e:
            logger.error(f"Исключение при запросе каналов {guild_id}: {e}")
            await asyncio.sleep(1)
    logger.error(f"Не удалось получить каналы для {guild_id} после {max_retries} попыток")
    return []

async def send_to_channel(token, channel_id, content, sem_send):
    async with sem_send:
        success, skip_token, err_type = await asyncio.get_event_loop().run_in_executor(
            None,
            send_discord_message_sync,
            token,
            channel_id,
            content
        )
        if skip_token:
            return "skip_token"
        if success:
            return "ok"
        else:
            return "fail"

def send_discord_message_sync(token, channel_id, content):
    url = f"https://discord.com/api/v9/channels/{channel_id}/messages"
    headers = {"Authorization": token, "Content-Type": "application/json"}
    try:
        resp = requests.post(url, json={"content": content}, headers=headers, timeout=15)
        if resp.status_code == 200:
            return True, False, None
        try:
            err_data = resp.json()
            error_msg = err_data.get("message", "")
        except:
            error_msg = "Unknown"
        if resp.status_code == 401:
            return False, True, "invalid_token"
        if resp.status_code == 403:
            if "phone" in error_msg.lower() or "verify" in error_msg.lower():
                return False, False, "phone_required"
            if "ограничен" in error_msg.lower() or "limited" in error_msg.lower() or "доступ" in error_msg:
                return False, True, "blocked"
            return False, False, "no_permission"
        if resp.status_code == 429:
            try:
                retry_after = err_data.get("retry_after", 0.5)
            except:
                retry_after = 0.5
            time.sleep(retry_after + 0.2)
            return send_discord_message_sync(token, channel_id, content)
        return False, False, "other"
    except Exception as e:
        logger.error(f"Исключение при отправке: {e}")
        return False, False, "exception"

async def process_token_optimized(token, photo, video, min_members, max_members, user_id, stop_event, token_index, total_tokens):
    logger.info(f"[{user_id}] Начинаем токен ...{token[-12:]} ({token_index}/{total_tokens})")
    content = f"{photo} {video}"

    guilds = await get_guilds_with_retry(token)
    if guilds is None:
        return 0

    filtered_guilds = []
    for g in guilds:
        members = g.get("approximate_member_count")
        if members is None:
            filtered_guilds.append(g)
            continue
        if min_members <= members <= max_members:
            filtered_guilds.append(g)
    if not filtered_guilds:
        logger.warning(f"[{user_id}] Нет подходящих серверов")
        return 0

    logger.info(f"[{user_id}] Найдено {len(filtered_guilds)} серверов для обработки")

    fetch_sem = asyncio.Semaphore(MAX_CONCURRENT_CHANNEL_FETCH)
    tasks = []
    for g in filtered_guilds:
        tasks.append(fetch_channels_for_guild_with_retry(token, g["id"]))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_channels = []
    token_invalid = False
    for res in results:
        if isinstance(res, list):
            all_channels.extend(res)
        elif res is None:
            token_invalid = True
            break
        elif isinstance(res, Exception):
            logger.error(f"[{user_id}] Ошибка при получении каналов: {res}")

    if token_invalid:
        logger.warning(f"[{user_id}] Токен невалиден – прерываем")
        return 0

    if not all_channels:
        logger.warning(f"[{user_id}] Нет доступных текстовых каналов ни на одном сервере")
        return 0

    logger.info(f"[{user_id}] Найдено {len(all_channels)} каналов с правом отправки")

    send_sem = asyncio.Semaphore(MAX_CONCURRENT_SENDS)
    send_tasks = []
    for ch_id in all_channels:
        if stop_event.is_set():
            logger.info(f"[{user_id}] Остановка по запросу")
            return 0
        send_tasks.append(send_to_channel(token, ch_id, content, send_sem))

    send_results = await asyncio.gather(*send_tasks, return_exceptions=True)

    sent_count = 0
    for res in send_results:
        if res == "ok":
            sent_count += 1
            prog = progress.get(user_id, {})
            prog["done"] = prog.get("done", 0) + 1
            progress[user_id] = prog
        elif res == "skip_token":
            logger.warning(f"[{user_id}] Токен прерван из-за критической ошибки")
            return sent_count

    logger.info(f"[{user_id}] Токен ...{token[-12:]} завершён. Отправлено {sent_count} сообщений")
    return sent_count

async def run_spam_for_user(user_id, tokens, photo, video, min_members, max_members):
    stop_event = asyncio.Event()
    stop_flags[user_id] = stop_event

    progress[user_id] = {"total": len(tokens), "done": 0, "current_token": tokens[0][-12:]}

    semaphore = asyncio.Semaphore(MAX_CONCURRENT_TOKENS)

    async def bounded_process(token, idx):
        async with semaphore:
            prog = progress.get(user_id, {})
            prog["current_token"] = token[-12:]
            progress[user_id] = prog
            await asyncio.sleep(0.5 * idx)  # задержка между стартами
            return await process_token_optimized(
                token, photo, video, min_members, max_members,
                user_id, stop_event, idx+1, len(tokens)
            )

    tasks = [asyncio.create_task(bounded_process(tok, i)) for i, tok in enumerate(tokens)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    total_sent = 0
    for res in results:
        if isinstance(res, int):
            total_sent += res
        elif isinstance(res, Exception):
            logger.error(f"[{user_id}] Ошибка при обработке токена: {res}")

    stop_flags.pop(user_id, None)
    progress.pop(user_id, None)
    return total_sent

# ========== ОБРАБОТЧИКИ TELEGRAM (без изменений) ==========
# Они полностью идентичны предыдущей версии, но я включу их для полноты.

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("▶️ Старт рассылку", callback_data="start_spam")],
        [InlineKeyboardButton("⏹ Стоп", callback_data="stop_spam")],
        [InlineKeyboardButton("📊 Статус", callback_data="status")],
    ]
    await update.message.reply_text(
        "👋 Привет! Я бот для рассылки в Discord.\n\n"
        "1. Нажмите **Старт рассылку**, чтобы ввести токены и ссылки.\n"
        "2. Во время работы можно нажать **Стоп** для экстренной остановки.\n"
        "3. **Статус** покажет прогресс текущей рассылки.",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = update.effective_user.id
    data = query.data

    if data == "stop_spam":
        stop_event = stop_flags.get(user_id)
        if stop_event:
            stop_event.set()
            await query.edit_message_text("⏹ Отправлен сигнал остановки.")
        else:
            await query.edit_message_text("ℹ️ Нет активной рассылки.")

    elif data == "status":
        prog = progress.get(user_id, {})
        if prog:
            total = prog.get("total", 0)
            done = prog.get("done", 0)
            current = prog.get("current_token", "—")
            await query.edit_message_text(f"📊 **Прогресс**\nВсего токенов: {total}\nОтправлено сообщений: {done}\nТекущий токен: ...{current}")
        else:
            await query.edit_message_text("ℹ️ Нет активной рассылки.")

# ========== ДИАЛОГ ВВОДА ==========
TOKENS, PHOTO, VIDEO, MIN_MEM, MAX_MEM = range(5)

async def start_spam_dialog(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📝 Введите токены Discord (каждый с новой строки):")
    return TOKENS

async def start_spam_dialog_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("📝 Введите токены Discord (каждый с новой строки):")
    return TOKENS

async def receive_tokens(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip()
    tokens = [t.strip() for t in text.splitlines() if t.strip()]
    if not tokens:
        await update.message.reply_text("Список пуст. Попробуйте снова.")
        return TOKENS
    context.user_data["tokens"] = tokens
    await update.message.reply_text(f"✅ Получено {len(tokens)} токенов. Теперь ссылку на фото.")
    return PHOTO

async def receive_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    if not url.startswith(("http://", "https://")):
        await update.message.reply_text("Не ссылка. Попробуйте ещё.")
        return PHOTO
    context.user_data["photo"] = url
    await update.message.reply_text("✅ Фото принято. Теперь ссылку на видео.")
    return VIDEO

async def receive_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text.strip()
    if not url.startswith(("http://", "https://")):
        await update.message.reply_text("Не ссылка. Попробуйте ещё.")
        return VIDEO
    context.user_data["video"] = url
    await update.message.reply_text("✅ Видео принято. Укажите минимальное количество участников (0 – без ограничений).")
    return MIN_MEM

async def receive_min_members(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        min_val = int(update.message.text.strip())
    except ValueError:
        await update.message.reply_text("Введите целое число.")
        return MIN_MEM
    context.user_data["min_members"] = min_val
    await update.message.reply_text("Теперь максимальное количество (0 – безлимит).")
    return MAX_MEM

async def receive_max_members(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    try:
        max_val = int(update.message.text.strip())
        if max_val <= 0:
            max_val = float('inf')
    except ValueError:
        await update.message.reply_text("Введите целое число.")
        return MAX_MEM

    data = context.user_data
    tokens = data.get("tokens")
    photo = data.get("photo")
    video = data.get("video")
    min_mem = data.get("min_members", 0)

    if not tokens or not photo or not video:
        await update.message.reply_text("Ошибка данных. Начните заново /start.")
        return ConversationHandler.END

    await update.message.reply_text(
        f"🚀 Запускаю рассылку для {len(tokens)} токенов.\n"
        f"Фильтр по участникам: от {min_mem} до {('∞' if max_val==float('inf') else max_val)}.\n"
        f"Одновременно обрабатывается до {MAX_CONCURRENT_TOKENS} токенов.\n"
        "Используйте кнопку **Стоп** для остановки."
    )

    task = asyncio.create_task(
        run_spam_for_user(user_id, tokens, photo, video, min_mem, max_val)
    )
    running_tasks[user_id] = task

    async def task_done_callback():
        try:
            sent_total = await task
            await update.message.reply_text(f"✅ Рассылка завершена. Всего отправлено: {sent_total}")
        except asyncio.CancelledError:
            await update.message.reply_text("⏹ Рассылка остановлена.")
        except Exception as e:
            await update.message.reply_text(f"❌ Ошибка: {e}")
        finally:
            running_tasks.pop(user_id, None)
            progress.pop(user_id, None)

    asyncio.create_task(task_done_callback())
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Отменено.")
    return ConversationHandler.END

# ========== MAIN ==========

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_handler, pattern="^(stop_spam|status)$"))

    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("spam", start_spam_dialog),
            CallbackQueryHandler(start_spam_dialog_callback, pattern="^start_spam$")
        ],
        states={
            TOKENS: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_tokens)],
            PHOTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_photo)],
            VIDEO: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_video)],
            MIN_MEM: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_min_members)],
            MAX_MEM: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_max_members)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
    app.add_handler(conv_handler)

    logger.info("Бот запущен. Нажмите /start в Telegram.")
    app.run_polling()

if __name__ == "__main__":
    main()
