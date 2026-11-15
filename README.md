# Gym

The original workout folder, exercise list, and workout page. Express and MongoDB are gone. Those screens read Supabase through the same Redux thunks.

## Local development

Node 20 or newer. From the repo root:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:5173. `.env.local` is gitignored. Vite reads it on startup.

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL. Inlined at build time. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script only. Do not prefix it with `VITE_`. |

Sign in with email and password. Registration stores the name on the profile trigger. If confirmation email is required, confirm before signing in. `Sign out` sits above the original screens so a session can be cleared. That control was not in the original UI.

`/exercises` is still a direct URL. The original app had no link to it.

## Scripts

```bash
npm run dev
npm run build
npm test
npm run seed:exercises
```

The exercise list uses the shared catalog (`owner_id` null) from [wrkout/exercises.json](https://github.com/wrkout/exercises.json). Cards still build the image URL from the exercise name, the same way as before. Seed when you have the service role key:

```bash
node scripts/seed-exercises.mjs --dry-run
SUPABASE_SERVICE_ROLE_KEY=... npm run seed:exercises
```

Netlify builds with the public URL and publishable key in `netlify.toml`. A value set in the Netlify UI overrides the file. `netlify.toml` rewrites every path to `index.html`.

## What the original UI does not include

The Express routes for creating and editing workouts and exercises had no screens. This client still only lists workouts, opens one, searches by name, and lists exercises. Set rows show the saved reps, weight, and completed check. They are not an editor.

There is no split-cycle home, cardio logger, history page, template editor, or estimated-1RM chart. Those are not part of the original interface.

`config/default.json` held a MongoDB Atlas URI and password. It stays out of the tree. The secret is still in git history and should be rotated.
