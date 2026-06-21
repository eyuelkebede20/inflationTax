# InflaTax — Inflation Tax Tracker

A small web app that shows how **inflation raises next year's tax**. For each
business you enter its **2017 total tax paid** and **2017 sales**; InflaTax
inflates the sales, re-applies the sales-tax bracket table (which can bump sales
into a higher bracket), and computes the extra tax inflation causes plus the new
**2018 total tax**. Signed-in users sync history & settings to Supabase;
anonymous users get full functionality with local history.

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

All pure functions live in [`src/lib/calc.ts`](src/lib/calc.ts). Inputs per
entry: `tax2017Paid`, `salesBefore` (2017 sales), `inflationRate` (default
`0.152`).

```
taxBefore  = salesBefore * bracketRate(salesBefore)
salesWith  = salesBefore * (1 + inflationRate)
taxWith    = salesWith   * bracketRate(salesWith)
difference = taxWith - taxBefore           // "Garaagaruma"
tax2018    = tax2017Paid + difference      // "Taaksii Bara 2018"
```

`bracketRate(amount)` — sales-tax table chosen by the amount:

| Amount (Birr)                | Rate |
| ---------------------------- | ---- |
| 0 – 100,000                  | 2%   |
| 100,001 – 500,000            | 3%   |
| 500,001 – 1,000,000          | 5%   |
| 1,000,001 – 1,500,000        | 7%   |
| 1,500,001 +                  | 9%   |

Inflation can push `salesWith` into a higher bracket than `salesBefore`, which
is what raises the tax. Verified against the source spreadsheet (e.g. sales
450,000 → tax 13,500 at 3%; inflated to 518,400 → tax 25,920 at 5%; difference
12,420; with 2017 tax 50,370 → 2018 tax 62,790).

> Amounts ≥ 2,000,000 default to the top 9% rate (table doesn't define higher).

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Vite dev server             |
| `npm run build`   | Type-check + production build → `dist`|
| `npm run preview` | Preview the production build          |
| `npm run lint`    | Type-check only                       |
