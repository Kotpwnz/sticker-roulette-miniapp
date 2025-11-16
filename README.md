# Sticker Roulette Mini App

Telegram Mini App с рулеткой на стикерах (NFT).

## Локальный запуск

1. Backend: `cd backend && pip install -r ../../requirements.txt && uvicorn main:app --reload`
2. Bot: `cd bot && pip install -r ../../requirements.txt && python bot.py`
3. Frontend: Открой web/index.html в браузере (для теста) или задеплой на Vercel.

## Деплой

- Web: Vercel (cd web && vercel)
- Backend: Railway (cd backend && railway up)
- Bot: Railway или VPS

Замени URL'ы в app.js и bot.py!
