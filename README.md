# Czytasyn

Web app that teaches a child to read, in Polish or English, built for the iPad
(installed to the home screen as a PWA, works offline). A parent signs in with
Google once; children pick their avatar and play. Children never have accounts.

## Stack

- Next.js (App Router) on Vercel
- Auth.js with Google sign-in (parent account)
- Supabase Postgres + Drizzle ORM (child profiles, lesson progress)
- Service worker for offline use, Web Speech API for the voice (recorded audio: TODO)

## Deploy (one time)

1. **Vercel** → New Project → import this repo → Deploy. Note the URL (e.g. `https://czytasyn.vercel.app`).
2. **Supabase** → New project → Connect → copy the **Transaction pooler** connection string (port 6543) and, optionally, the **Direct connection** string.
3. **Google Cloud** → create project → OAuth consent screen (External, add yourself as test user) →
   Credentials → OAuth client ID (Web application) with redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-vercel-url>/api/auth/callback/google`
4. Vercel project → Settings → **Environment Variables**:
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` from step 3
   - `AUTH_SECRET` — any random string (https://generate-secret.vercel.app/32)
   - `DATABASE_URL` (pooler string from step 2) and `DIRECT_URL` (direct string, optional)
5. Deployments → Redeploy. The build runs the database migrations automatically
   (`scripts/migrate.mjs`), so no manual database setup is needed.

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
  install/page.tsx          "add to home screen" instructions
src/components/             LessonRunner, ParentGate, offline sync, SW registration
src/content/lessons.ts      lesson content (PL + EN) and UI strings
src/actions/children.ts     server actions: children + progress
src/db/                     Drizzle schema + connection
src/lib/audio.ts            iPad audio unlock, speech, reward sounds
public/sw.js                service worker
drizzle/                    SQL migrations (generated with `npm run db:generate`)
```

## Changing the schema

Edit `src/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`.
It is applied on the next deploy.

## Roadmap

- Recorded phoneme audio per language instead of speech synthesis
- More lesson types: blending (sound-by-sound), word ↔ picture matching, short sentences
- Themes with illustrations instead of emoji
- Parent dashboard with per-sound mastery
