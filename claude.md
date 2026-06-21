# CLAUDE.md

Build instructions for **Tax & Inflation Calculator** — a small web app that takes a 2017 EC
taxable amount, derives the prior year (2016 EC) via inflation, and computes profit tax plus a
"curfew" schedule rate for both years. Authenticated users save history to Supabase; anonymous
users can still use the app with local history.

---

## 1. Tech stack

- **Frontend:** React + Vite (TypeScript). Plain CSS or Tailwind — keep it simple and clean.
- **Backend / DB / Auth:** Supabase (Postgres + Auth).
- **Routing:** React Router.
- **State:** local component state + a small `useAuth` hook; no heavy state library needed.
- Login is **optional**. The app must be fully usable signed out; signing in just loads/saves
  your history and settings to the cloud.

---

## 2. Configuration

Create a single config file the user fills in. Do **not** hardcode keys anywhere else.

`src/config.ts`
```ts
export const SUPABASE_URL = "PASTE_YOUR_PROJECT_URL";
export const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY";

// Default inflation rate. Users can override this per-account in Settings.
export const DEFAULT_INFLATION_RATE = 0.152;
```

---

## 3. The calculation engine (most important — get this exact)

Put all of this in `src/lib/calc.ts` as pure functions. No rounding inside the math; round only
for display (2 decimals for Birr, rate as a %).

### 3.1 Inputs
- `taxable2017: number` — the amount the user types in (Birr, 2017 EC).
- `inflationRate: number` — from settings, default `0.152`.

### 3.2 Derive last year (2016 EC)
```ts
const taxable2016 = taxable2017 / (1 + inflationRate);
```
> Assumption A: 2017 is deflated to 2016 by dividing by (1 + inflation). If the intent is the
> reverse (last year is the input, this year inflated up), flip this and re-label the UI.

### 3.3 Profit tax (Schedule-C bracket formula)
Translated directly from the spreadsheet IF formula. Applies to **both years**, each using its
own taxable amount.
```ts
export function profitTax(g: number): number {
  if (g <= 7200)    return 0;
  if (g <= 19800)   return g * 0.10 - 720;
  if (g <= 38400)   return g * 0.15 - 1710;
  if (g <= 63000)   return g * 0.20 - 3630;
  if (g <= 93600)   return g * 0.25 - 6780;
  if (g <= 130800)  return g * 0.30 - 11460;
  return g * 0.35 - 18000; // g > 130,800
}
```
```ts
const profitTax2016 = profitTax(taxable2016);
const profitTax2017 = profitTax(taxable2017);
```

### 3.4 Schedule rate ("curfew" table)
The attached table maps an annual amount to a percentage. The bracket is chosen by **each year's
own taxable amount**, and applies to **both years**.

| Taxable amount (Birr)        | Rate |
| ---------------------------- | ---- |
| 0 – 100,000                  | 2%   |
| 100,001 – 500,000            | 3%   |
| 500,001 – 1,000,000          | 5%   |
| 1,000,001 – 1,500,000        | 7%   |
| 1,500,001 – below 2,000,000  | 9%   |

```ts
export function scheduleRate(amount: number): number {
  if (amount <= 100000)   return 0.02;
  if (amount <= 500000)   return 0.03;
  if (amount <= 1000000)  return 0.05;
  if (amount <= 1500000)  return 0.07;
  return 0.09; // 1,500,001 and above
}
```
> Assumption B: amounts **≥ 2,000,000** are not in the table, so they default to 9%. Change the
> last line if there is a higher bracket.

### 3.5 Curfew result — taxable × rate (for both years)
The **taxable amount** (not the profit tax) is multiplied by the schedule rate.
```ts
const rate2016   = scheduleRate(taxable2016);
const rate2017   = scheduleRate(taxable2017);
const curfew2016 = taxable2016 * rate2016;
const curfew2017 = taxable2017 * rate2017;
```

### 3.6 Single result object
```ts
export interface CalcResult {
  taxable2017: number;
  inflationRate: number;
  taxable2016: number;
  profitTax2016: number;
  profitTax2017: number;
  rate2016: number;
  rate2017: number;
  curfew2016: number;
  curfew2017: number;
}
```

---

## 4. Pages & layout

### 4.1 Main page `/` — two sections
- **Data input** (top): one numeric field for the 2017 EC taxable amount + a **Calculate** button.
  Show the current inflation rate in use, with a small "change in Settings" link. On Calculate,
  compute a `CalcResult`, save it (DB if signed in, else localStorage), and prepend it to history.
- **History** (below): a list/table of past calculations (label or date, 2017 amount, 2017 profit
  tax, 2017 curfew). Each row is clickable.

### 4.2 Analysis board (on clicking a history row)
Open as a route `/analysis/:id` or a modal. Show a side-by-side **2016 vs 2017** breakdown:
- Taxable amount (2016 derived, 2017 input) and inflation rate used.
- Profit tax 2016 / 2017, plus year-over-year change (absolute + %).
- Schedule rate 2016 / 2017 and curfew result 2016 / 2017, plus year-over-year change (absolute + %).
- A small bar chart comparing the two years (profit tax and curfew). Guard against divide-by-zero
  when a base value is 0 (show "—" instead of Infinity).

### 4.3 Navigation
Only one nav item: **Profile**. It opens the profile area containing **Settings**, **History
controls**, and **Account**.

### 4.4 Profile (`/profile`)
- **Settings:** edit the **inflation rate** (default 0.152). Persist per-user in DB when signed
  in, else localStorage. Validate it's a non-negative number.
- **Reset history:** button that deletes *all* of this user's calculations (with a confirm
  dialog). Deletes from DB if signed in, else clears localStorage.
- **Account / password:**
  - **Change password** (signed in): `supabase.auth.updateUser({ password })`.
  - **Forgot password:** `supabase.auth.resetPasswordForEmail(email, { redirectTo })` sends an
    email link to the update-password page.

### 4.5 Auth pages
- `/login`, `/signup` (email + password).
- `/reset-password` (request reset email).
- `/update-password` (landing page from the reset email; sets a new password).
- Signed-out users are NOT redirected away from `/`; they can use the calculator freely.

---

## 5. Supabase: schema, RLS, and SQL

Run this in the Supabase SQL editor.

```sql
-- Per-user settings (inflation rate)
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  inflation_rate numeric not null default 0.152,
  updated_at timestamptz not null default now()
);

-- Saved calculations / history
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  label text,
  taxable_2017 numeric not null,
  inflation_rate numeric not null,
  taxable_2016 numeric not null,
  profit_tax_2016 numeric not null,
  profit_tax_2017 numeric not null,
  schedule_rate_2016 numeric not null,
  schedule_rate_2017 numeric not null,
  curfew_2016 numeric not null,
  curfew_2017 numeric not null
);

-- Row Level Security
alter table public.user_settings enable row level security;
alter table public.calculations  enable row level security;

create policy "own settings - select" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "own settings - upsert" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "own settings - update" on public.user_settings
  for update using (auth.uid() = user_id);

create policy "own calcs - select" on public.calculations
  for select using (auth.uid() = user_id);
create policy "own calcs - insert" on public.calculations
  for insert with check (auth.uid() = user_id);
create policy "own calcs - delete" on public.calculations
  for delete using (auth.uid() = user_id);

create index calculations_user_created_idx
  on public.calculations (user_id, created_at desc);
```

---

## 6. Anonymous vs signed-in behavior

| Action            | Signed out                          | Signed in                        |
| ----------------- | ----------------------------------- | -------------------------------- |
| Calculate         | works                               | works                            |
| Save to history   | `localStorage` key `calc_history`   | `calculations` table             |
| Inflation setting | `localStorage` key `calc_settings`  | `user_settings` table            |
| Reset history     | clears localStorage                 | deletes user's rows              |
| Change password   | hidden / disabled                   | available                        |

Optional nicety: on first sign-in, offer to import any localStorage history into the DB.

---

## 7. Suggested file structure

```
src/
  config.ts
  lib/
    calc.ts          // profitTax, scheduleRate, full computeResult()
    supabase.ts      // createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    storage.ts       // read/write history + settings (DB or localStorage)
  hooks/
    useAuth.ts
    useSettings.ts
  components/
    DataInput.tsx
    HistoryList.tsx
    AnalysisBoard.tsx
    Nav.tsx
  pages/
    Home.tsx
    Profile.tsx
    Login.tsx
    Signup.tsx
    ResetPassword.tsx
    UpdatePassword.tsx
  App.tsx
  main.tsx
```

---

## 8. Display rules
- Money: format as Birr with thousands separators and 2 decimals.
- Rates: show as a percentage (e.g. `0.05` → `5%`).
- Never show `Infinity`/`NaN`; show `—` when a percentage change has a zero base.

---

## 9. Assumptions to confirm
- **A. Inflation direction:** `taxable2016 = taxable2017 / (1 + 0.152)`.
- **B. Above 2,000,000:** defaults to the top 9% rate (table doesn't define higher).
- The schedule rate is applied to the **taxable amount**, and profit tax is computed separately;
  both are reported per year. (Confirmed.)