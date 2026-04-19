evolution game bot

## Structure

```text
src/
  app/                  # bootstrap + runtime mode resolution
  config/               # env loading and validation
  integrations/         # external services clients
  transport/            # telegram, polling and webhook transports
  shared/               # cross-cutting utilities
```

## Scripts

- `npm run dev` -> polling mode
- `npm run build` -> build TypeScript to `dist/`
- `npm start` -> build + webhook mode from `dist/index.js`
- `npm run supabase:types` -> generate `src/integrations/supabase/database.types.ts`

## Required env variables

- `BOT_TOKEN`
- `WEATHER_API_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PROJECT_ID`
- `PORT` (optional, default `3000`)
- `DOMAIN` (required for webhook mode)
