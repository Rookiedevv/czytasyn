# Czytasyn

Web app that teaches a child to read, in Polish or English, built for the iPad
(installed to the home screen as a PWA, works offline). A parent signs in with
Google once; children pick their avatar and play. Children never have accounts.

## Stack

- Next.js (App Router) on Vercel
- Supabase: Google sign-in (parent account) and Postgres (child profiles, lesson progress)
- Service worker for offline use, Web Speech API for the voice (recorded audio: TODO)

## Deploy (one time)

1. **Supabase** → project → SQL Editor → paste and run `supabase/schema.sql` (creates the two
   `czytasyn_*` tables with Row Level Security). Then Authentication → Providers → enable **Google**
   (needs a Google Cloud OAuth client whose redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Vercel** → New Project → import this repo. Environment variables (from Supabase → Connect → Framework):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   Deploy and note the URL.
3. Supabase → Authentication → URL Configuration → add `https://<your-vercel-url>/auth/callback` to Redirect URLs.

Then on the iPad: open the URL in Safari → Share → **Add to Home Screen**.

## Local development

```bash
npm install
vercel env pull .env.local   # or copy .env.example and fill it in
npm run dev
```

Open `http://localhost:3000`. To test on the iPad over Wi-Fi use `npm run dev -- -H 0.0.0.0`
and open `http://<your-computer-ip>:3000` (Google sign-in only works on the
`localhost` / production URLs registered in Google Cloud; use the production URL for auth tests).

## Project layout

```
src/app/                    routes
  page.tsx                  sign-in (parent)
  app/page.tsx              child picker
  app/parent/page.tsx       parent area (behind a parent gate)
  app/play/[childId]/       lesson map → lesson
  auth/callback/route.ts    Google sign-in return URL
  install/page.tsx          "add to home screen" instructions
src/components/             LessonRunner, ParentGate, offline sync, SW registration
src/content/lessons.ts      lesson content (PL + EN) and UI strings
src/actions/children.ts     server actions: children + progress (Supabase, RLS-protected)
src/lib/supabase/           Supabase clients (server, browser)
src/lib/audio.ts            iPad audio unlock, speech, reward sounds
src/proxy.ts                session refresh + /app protection
public/sw.js                service worker
supabase/schema.sql         database tables and policies
```

## Roadmap

- Recorded phoneme audio per language instead of speech synthesis
- More lesson types: blending (sound-by-sound), word ↔ picture matching, short sentences
- Themes with illustrations instead of emoji
- Parent dashboard with per-sound mastery
