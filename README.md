# Skin Tracker (demo)

A 90-day Clear Skin Challenge app with a Health Center home screen.
**This is the demo build: sample data only, no login, no server, nothing is saved.**

**Live demo:** https://mcgee2262.github.io/skin-tracker-demo/

## What's in it
- **Home**: today ring, week dots, module cards (Skin, Sleep, Water, Workout, Mood), quick log, "What I notice" insight
- **Skin**: Clear Skin Score, daily routine, check-in (ghost camera, tap your spots, habit tags)
- **Progress**: score chart, problem-zone heat map, "What helps", Day 30/60/90 before and after, ranks
- **Photos**: grid, compare, timelapse
- **Products**: shopping lists with status

## Run it on your Mac
```bash
npm install
npm run dev
```
Open the link it prints. Demo mode turns on whenever `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set.

Built with React, Vite, TypeScript and a PWA (installable from Safari: Share, then Add to Home Screen).

## Update the live demo
```bash
./deploy.sh
```
