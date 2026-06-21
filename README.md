# InflaTax — Inflation Tax Tracker

A small web app that takes a **2017 EC** taxable amount, derives the prior year
(**2016 EC**) via inflation, and computes **profit tax** plus a **schedule
("curfew") rate** for both years. Signed-in users sync history & settings to
Supabase; anonymous users get full functionality with local history.

Built with **React + Vite + TypeScript**, **React Router**, and **Supabase**.

---

## Quick start (local)

```bash
npm install
npm run dev
```

The app works immediately in **anonymous mode** (history + settings in
`localStorage`). To enable accounts/cloud sync, configure Supabase (below).

## Configure Supabase (optional — enables login & cloud sync)

1. Create a project at [supabase.com](https://supabase.com).
2. In **Database → SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. Provide your credentials in **either** way:
   - Edit `src/config.ts` and paste your Project URL + anon key, **or**
   - Set env vars (recommended for deploys): copy `.env.example` to `.env` and
     fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

When no valid credentials are present, all auth UI is hidden and the app runs
anonymously.

## Deploy to Vercel

This repo is Vercel-ready (`vercel.json` handles the SPA build & client-side
routing rewrite).

1. Push this folder to a Git repo and **Import Project** in Vercel
   (framework preset: **Vite**), or run `npx vercel`.
2. In **Project Settings → Environment Variables**, add (optional, for auth):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. Build command `npm run build`, output `dist` (already set).
4. If you use password reset, add your deployed URL +
   `/update-password` to Supabase **Authentication → URL Configuration →
   Redirect URLs**.

## The math

All pure functions live in [`src/lib/calc.ts`](src/lib/calc.ts):

- `taxable2016 = taxable2017 / (1 + inflationRate)` (default rate `0.152`).
- `profitTax(g)` — Schedule-C bracket formula, applied per year.
- `scheduleRate(amount)` — curfew table (2% … 9%), chosen by each year's amount.
- Curfew result = `taxable × scheduleRate`, per year.

### Assumptions (see CLAUDE.md §9)

- **A.** Inflation deflates 2017 → 2016 by dividing by `(1 + rate)`.
- **B.** Amounts ≥ 2,000,000 default to the top 9% schedule rate.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Vite dev server             |
| `npm run build`   | Type-check + production build → `dist`|
| `npm run preview` | Preview the production build          |
| `npm run lint`    | Type-check only                       |
