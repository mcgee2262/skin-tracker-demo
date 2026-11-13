# Skin Tracker — Claude Code instructions

You are building **Skin Tracker**, a personal phone app (PWA) for a 90-day "Clear Skin Challenge" focused on blackheads. Read `SPEC.md` for the full feature spec, `DESIGN.md` for the look, and `supabase/schema.sql` for the database. Build exactly what they describe; keep it simple.

## Owner
Blaise. Single user, personal app, used daily on an iPhone (installed to Home Screen) and occasionally on a Mac.

## Stack (do not change without asking)
- React + Vite + TypeScript
- `vite-plugin-pwa` (installable, offline shell, iOS meta tags, app icon)
- Supabase: Auth (email magic link), Postgres, Storage
- Netlify for hosting (`netlify.toml` with SPA redirect)
- Plain CSS with CSS variables (no Tailwind, no UI kit)
- `react-router-dom` for the 4 tabs + Check In flow

## Hard rules
1. **Health Center-ready.** This app will later be merged into a bigger "Health Center" app on the same Supabase project. So:
   - All tables are prefixed `skin_` and every row has `user_id` (RLS on).
   - Photos go in the private bucket `health-photos` at `{user_id}/skin/{YYYY-MM-DD}.jpg`.
   - Keep skin logic in `src/features/skin/` so it can be lifted into another app as a module.
2. **Simple.** 3–4 screens, one daily action. No settings page beyond a small "Challenge start date" + sign out in a sheet. No AI/API calls. No analytics.
3. **Fast check-in.** Whole daily flow under 30 seconds.
4. **Phone-first.** Design at 390×844; safe-area insets; touch targets ≥ 44px.
5. Secrets only via env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Provide `.env.example`. Never commit `.env`.

## Suggested structure
```
src/
  main.tsx, App.tsx, routes.tsx
  lib/supabase.ts
  features/skin/
    api.ts            (all Supabase reads/writes for skin_*)
    score.ts          (Clear Skin Score + ranks — pure functions, unit tested)
    routine.ts        (Differin ramp-up logic — pure, unit tested)
    screens/Today.tsx, CheckIn.tsx, Progress.tsx, Photos.tsx, Products.tsx
    components/ (ScoreRing, Timelapse, GhostCamera, SpotTapper, RoutineChecklist, HeatMap, ...)
  styles/tokens.css
```

## Build order
1. Scaffold Vite + PWA + router + tab bar shell + design tokens.
2. Supabase client, magic-link login screen, run `supabase/schema.sql` + `supabase/seed.sql` instructions in README.
3. Today screen (reads latest check-in + challenge).
4. Check In flow: timelapse → ghost camera → snap → spot tapper → routine → save.
5. Progress screen (score chart, heat map, stats, milestones, ranks).
6. Photos screen (grid, compare two, full timelapse).
7. Products screen (Mom's/Dad's toggle, status cycling, Target links).
8. Unit tests for `score.ts` and `routine.ts` (Vitest).
9. Netlify config + README deploy steps.

After each step, run the dev server and make sure it builds with no TypeScript errors before moving on.
