# Gym

A mobile-first training log. The cycle is cardio, chest and back, shoulders and arms, legs, then one rest day. Strength exercises log a pyramid of 12, 10, 8, 6 and 4 reps (about 2 reps in reserve, 1 on the set of 4) and a back-off set at the 8-rep weight, aiming for 12. Drop segments hang off that back-off.

The app is a Vite + React + TypeScript client. Supabase Auth, Postgres, and row level security replace the old Express, Mongoose, and MongoDB server. TanStack Query holds server state (workouts, sets, the exercise catalog) and refreshes it after each save. The Supabase session lives in a small React context. The previous Redux store only wrapped list fetches, so it is gone.

## Local development

Node 20 or newer.

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Create an account with email and password. If the Supabase project requires email confirmation, confirm the address before signing in. The signup trigger writes `profiles.name` from the name you enter.

### Environment variables

| Name | Where it is read | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vite client | Project URL. Inlined at build time. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite client | Public publishable key. Safe to ship in the browser. |
| `SUPABASE_URL` | Seed script | Same project URL. Falls back to `VITE_SUPABASE_URL`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script only | Bypasses row level security to insert the shared catalog. |

Copy the values into `.env` for local work. On Netlify or Vercel, set the two `VITE_` variables in the host UI before the build. Vite bakes them into the bundle. Do not set the service role key on the frontend host, and do not prefix it with `VITE_`.

The publishable key in `.env.example` is public by design. The service role key is never committed.

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # typecheck and production build
npm run typecheck
npm test             # set scheme, Epley 1RM, next-split, search
npm run seed:exercises
```

## Exercise catalog

Shared exercises (`owner_id` null) come from [wrkout/exercises.json](https://github.com/wrkout/exercises.json). Authenticated users can read them. Inserting them requires the service role key, because row level security only allows a user to insert rows they own.

The script is one-off and idempotent (upsert on `source_id`, the dataset directory id). It is not part of install, dev, or build. Images are stored as raw GitHub URLs from that repository.

```bash
# preview the first rows, no database writes
node scripts/seed-exercises.mjs --dry-run

# write the catalog
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key npm run seed:exercises
```

The key is in the Supabase dashboard under Project Settings → API. Keep it out of git.

Until the seed has been run, the library is empty except for exercises you add yourself.

## Deploy

`netlify.toml` builds the app, publishes `dist`, and rewrites every path to `index.html` so client-side routes work. The old rewrite that proxied `/api` to another Netlify host is gone. There is no Express server.

`vercel.json` has the same single-page rewrite. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the project settings, then deploy the repository root.

In the Supabase dashboard, add the deployed origin to Authentication → URL configuration if you use email links.

## Data model

The hosted schema is already applied. This repo does not ship SQL migrations. Authenticated users only see their own workouts, sets, templates, and cardio; they can read the shared exercise catalog and their own custom exercises.

A logged workout's `split` decides the next day: cardio → chest & back → shoulders & arms → legs → rest → cardio. A day marked `other`, or an empty history, starts the cycle at cardio.

Estimated one-rep max is the Epley formula, weight × (1 + reps / 30), taken from completed sets. Warm-up sets are left out of the chart.

## Credential note

`config/default.json` held a MongoDB Atlas connection string and password. That file is removed from the tree. The secret is still in git history and should be rotated.
