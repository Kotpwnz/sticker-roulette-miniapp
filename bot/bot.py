import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command

API_TOKEN = ''  # Получи у @BotFather

bot = Bot(token=API_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    webapp_url = "https://your-miniapp.vercel.app"  # Замени на URL твоего деплоя web/
    web_app = types.WebAppInfo(url=webapp_url)
    
    keyboard = types.ReplyKeyboardMarkup(
        keyboard=[[types.KeyboardButton(text="🎰 Играть в Sticker Roulette", web_app=web_app)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    await message.answer(
        "🎰 Добро пожаловать в Sticker Roulette!\n"
        "Добавляй стикеры — их цена определяет шанс на выигрыш.\n"
        "Нажми кнопку ниже, чтобы начать!",
        reply_markup=keyboard
    )

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
