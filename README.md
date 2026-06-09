# VIAVOX Tracker

System rejestracji godzin projektowych.

## Setup

1. Wklej `SUPABASE_SETUP.sql` w Supabase SQL Editor i uruchom
2. Skopiuj `.env.example` jako `.env` i uzupełnij klucze
3. `npm install && npm start`

## Vercel deploy

1. Wrzuć repo na GitHub
2. Połącz z Vercel
3. W Vercel → Settings → Environment Variables dodaj:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_KEY`
