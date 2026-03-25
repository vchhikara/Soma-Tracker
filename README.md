# SOMA Tracker 🏋️

A 3D personal fitness tracker built with React, React Three Fiber, Recharts, and Supabase.

**Live app:** https://vchhikara.github.io/Soma-Tracker

---

## What it does

- 3D interactive human body model — hover any region for measurements
- Per-profile data — multiple users on the same device
- Body measurement tracking with full bilateral (left/right) support
- Progress analytics — line charts, bar charts, radar, pie chart
- Workout tracker — log exercises with per-set reps and weights
- Supabase backend with localStorage fallback

---

## Tech stack

| Layer | Library |
|---|---|
| UI framework | React 18 + TypeScript |
| 3D rendering | React Three Fiber + drei + Three.js |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Bundler | Vite |
| Deployment | GitHub Pages |

---

## Local setup

### 1. Clone the repo

```bash
git clone https://github.com/vchhikara/Soma-Tracker.git
cd Soma-Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from: **supabase.com → your project → Settings → API**

> ⚠️ Never commit `.env` to Git. It is already in `.gitignore`.

### 4. Set up the Supabase database

1. Go to **supabase.com → your project → SQL Editor**
2. Open the file `supabase_schema.sql` from this repo
3. Paste the contents and click **Run**

This creates the `profiles`, `fitness_entries`, and `workouts` tables.

### 5. Add your 3D model

Place your GLB file at:

```
public/models/human_body.glb
```

Your GLB must have meshes named exactly:

| Mesh name | Body region |
|---|---|
| `body` | Base silhouette (everything else) |
| `neck` | Neck circumference |
| `shoulders` | Shoulder width |
| `chest` | Chest at nipple line |
| `belly` | Belly at navel |
| `waist` | Natural waist |
| `glutes` | Widest hip point |
| `bicepsL` / `bicepsR` | Flexed mid-upper arm |
| `forearmsL` / `forearmsR` | Widest forearm |
| `wristsL` / `wristsR` | Just above wrist joint |
| `thighsMaxL` / `thighsMaxR` | Mid-thigh max circumference |
| `thighsMinL` / `thighsMinR` | Just above knee |
| `calvesL` / `calvesR` | Maximum calf circumference |
| `anklesL` / `anklesR` | Narrowest above ankle |

**Names are case-sensitive. No spaces.**

In Blender: select a region → P → Separate by selection → rename in the Item panel (N key).

### 6. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173

---

## Project structure

```
soma-tracker/
├── public/
│   └── models/
│       └── human_body.glb        ← your 3D model
├── src/
│   ├── types/
│   │   └── fitness.ts            ← all TypeScript interfaces
│   ├── lib/
│   │   ├── supabase.ts           ← Supabase client
│   │   ├── storage.ts            ← data service (Supabase + localStorage)
│   │   └── bodyParts.ts          ← mesh name → data field map
│   ├── components/
│   │   └── BodyCanvas3D.tsx      ← R3F canvas component
│   ├── App.tsx                   ← main app (profiles, views, modals)
│   ├── main.tsx                  ← React entry point
│   └── index.css                 ← global styles
├── .env                          ← your secrets (never commit)
├── .env.example                  ← template (safe to commit)
├── .gitignore
├── supabase_schema.sql           ← run once in Supabase SQL editor
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Deploy to GitHub Pages

### Step 1 — Push your code

```bash
git add .
git commit -m "initial commit"
git push origin main
```

### Step 2 — Add secrets to GitHub

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these two secrets:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

### Step 3 — Enable GitHub Pages

Go to your repo → **Settings → Pages**
- Source: **GitHub Actions**
- Click Save

### Step 4 — Trigger a deployment

The workflow runs automatically on every push to `main`. Go to **Actions** tab to watch it build. When done, your app is live at:

```
https://vchhikara.github.io/Soma-Tracker
```

---

## Future features (roadmap)

- [ ] Reactive 3D model — mesh scaling based on measurements
- [ ] Pose animations — front bicep, side, back, relaxed
- [ ] Supabase Auth — login with email/password
- [ ] Export data as CSV
- [ ] Progress photos upload
- [ ] Goal setting and progress alerts

---

## Security notes

- Supabase credentials go in `.env` only — never in source code
- The `.env` file is in `.gitignore` and will never be pushed
- GitHub Actions reads credentials from encrypted repository secrets
- Row Level Security (RLS) can be enabled in Supabase when you add Auth
