# claude.md

Living spec + progress log for **InflaTax** — a web app for computing
*Taaksii Bara 2018* (this year's tax) for Schedule **"B"** taxpayers
(*Taaksii Kafalaa Gibiraa Sadarkaa "B" 2018*). Keep this file updated whenever
features change — it's how we track progress.

> The numeric model lives here **and** in `claude.logic.md` (the worked example).
> `claude.ideas.md` holds the running feature ideas. The column layout follows
> the official Schedule-"B" spreadsheet.

---

## 1. Tech stack
- **Frontend:** React + Vite + TypeScript. Plain CSS (`src/index.css`).
- **Routing:** React Router, route chunks code-split with `React.lazy`.
- **i18n:** custom context, **English + Afaan Oromo** only (default Oromo).
- **Backend / DB / Auth:** Supabase (Postgres + Auth) — **scaffolded, not yet
  switched on** (`config.AUTH_ENABLED === false`). Until then the app runs on
  `localStorage` and a dev identity switcher.

## 2. Configuration (`src/config.ts`)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — env vars win (`VITE_*`).
- `DEFAULT_INFLATION_RATE = 0.152`, `DEFAULT_RENTAL_SHARE = 0.5`.
- `AUTH_ENABLED = false` — gates all auth UI/routes + the dev switcher.
- `SUPABASE_ENABLED` — true when real credentials are present.

## 3. Calculation engine (`src/lib/calc.ts`) — the important part
Two **required** inputs per taxpayer: `turnover` (sales, col F) and
`lastYearTax` (tax paid 2017, col E). Plus a `kind`: `tax` | `rental`.

```
base        = kind === "rental" ? turnover * rentalShare(0.5) : turnover
taxBefore   (G) = base * scheduleRate(base)
salesWith   (H) = base * (1 + inflationRate)
taxWith     (I) = salesWith * scheduleRate(salesWith)
garaagaruma (J) = taxWith - taxBefore          // I − G
taaksii2018 (K) = lastYearTax + garaagaruma    // E + J
```

`scheduleRate` (curfew/proclamation): ≤100k→2%, ≤500k→3%, ≤1M→5%, ≤1.5M→7%,
else 9%. Worked example: 450,000 + 50,370 → **62,790**.

> Removed in v2 (dead code): `profitTax`, TOT, profit margin, the turnover
> back-solve, and the service toggle. Don't reintroduce them.

## 4. Roles & hierarchy (`src/hooks/RoleContext.tsx`, `src/lib/storage.ts`)
```
superadmin ──creates──> admin (= branch manager, owns one branch)
                            └──creates──> user (employee)
                                              └──creates──> entries
```
- **superadmin** — creates/removes admins, sets global rates, sees everything
  overall + the void feed. Has a **side dashboard** (`/superadmin`). Clicking an
  admin opens that admin's sub-panel to **create/reset/remove their employees**
  (so the superadmin can help an admin who can't).
- **admin** — branch manager. Creates/removes employees, resets their passwords,
  **approves/rejects void requests**, sees a per-employee branch summary
  (`/admin`).
- **user** — employee. Creates entries (owned by them), sees only their own,
  and can **request a void** on a printed (locked) entry.

While `AUTH_ENABLED` is false, the nav has a **dev identity switcher** (pick
superadmin / any admin / any employee). Accounts + passwords are a localStorage
**preview** (plaintext) — real auth replaces this; creating real admins/users
needs a server-side function using the Supabase service role.

## 5. Entry lifecycle: print → lock → void
- Each history row has a **Print card** action → prints a single card in the
  selected language, **signed by** the creator (`ownerName`) with the transaction
  **Ref** ID and a **QR code** (the self-contained share link, generated locally
  via the lazy-loaded `qrcode` lib), then **locks** the row (`locked`,
  `printed_at`). Entries store `owner_id` + `owner_name`.
- Unlocked rows: the owner can delete them.
- Locked rows are immutable. An employee can **request a void** (reason
  required) → pending. The branch **admin approves/rejects**. Approved → row
  `voided` (kept, struck through). Admins can void directly (auto-approved).
  Every request/void is visible to the superadmin overall.

## 6. Pages
- `/` — dashboard: entry form + history (search, pagination 20/page, print-all).
  Scope by identity (user→own, admin→branch, superadmin→all).
- `/analysis/:id` — full breakdown (before vs with inflation, bars).
- `/admin` — branch manager dashboard (team, void approvals, employee summary).
- `/superadmin` — side dashboard (overview, admins, rates, voids).
- `/profile` — change password only (slimmed in v2).
- `/shared` — read-only shared analysis from a self-contained link.
- `/login` `/signup` `/reset-password` `/update-password` — gated by AUTH_ENABLED.

## 7. Display rules
- Money: Birr, thousands separators, 2 decimals. Rates as `%`. Never show
  `Infinity`/`NaN` → `—`. Table columns use the official bilingual labels.

## 8. Supabase (`supabase/schema.sql`, `supabase/seed.sql`)
Tables: `branches`, `profiles` (role + branch, auto-created on signup),
`app_settings` (singleton rates), `calculations` (full result + `owner_id`/
`owner_name` + lock/void columns), `void_requests` (request → approve/reject).
RPCs: `request_void`, `decide_void`. Views: `branch_stats`, `employee_stats`
(`security_invoker` so dashboards aggregate in the DB under the caller's RLS —
no pulling every row to the client). RLS scopes rows by user/branch/superadmin
and wraps `auth.uid()` in `(select auth.uid())` (per-statement, not per-row).
Indexes for 100+ users: `(user_id, created_at)`, `(branch_id, created_at)`,
`(created_at)` global feed, and `pg_trgm` GIN on `name`/`tin`/`business_type`
for fast `ILIKE` search. `seed.sql` seeds a superadmin (change creds first).

## 9. Progress / changelog
- **v1** — initial: TOT + profit-tax model, per-user history, optional auth,
  3-language (en/am/om), chat widget, share links.
- **v2** — rebuilt to the **rental/tax curfew model** (this file §3); killed dead
  code; roles + branches scaffolded with dev switcher; print-locks-row; void
  trail; pagination; lazy routes; slimmed profile; superadmin-managed global
  rates; full schema/RLS/seed.
- **v2.1** — dropped Amharic (en/om only, **Oromo default**); table headers +
  print cards use the official bilingual column labels and the selected language;
  grouped **"Taaksii 2018"** header.
- **v3** (current) — full hierarchy **superadmin → admin → user**; admins create
  employees / reset passwords / remove; superadmin creates/removes admins; **void
  approval flow** (employee requests → admin approves → superadmin sees overall);
  per-employee branch summary; superadmin **side dashboard**; entries carry their
  owner (`ownerName`); schema updated (`void_requests`, `request_void`/
  `decide_void`, `owner_name`).
- **v3.1** (current) — fixed an Admin-dashboard infinite render loop; inputs
  styled consistently (bare/search inputs); main history table fits with **no
  horizontal scroll** (compact numbers, wrapped headers, smaller font); removed
  the "Before vs with inflation" card. Superadmin can **drill into an admin** and
  manage that admin's employees (shared `UserManager`). Every entry is **signed**
  (owner + `owner_id`) and printed cards carry a **QR code** (lazy `qrcode`).
- **v3.2** (current) — UI/i18n consistency pass: localized the last hardcoded
  strings (Analysis back link + "not found", chat close button → `common.close`,
  `analysis.not_found`); verified en/om key parity (229 each, no fallbacks).
  Removed dead CSS from retired features (`.toggle`/`.slider`, `.compare-grid`/
  `.rowlabel`/`.col-delta`, `.callout`) and renamed stale bar classes
  `.y2016`/`.y2017` → `.before`/`.with`. CSS bundle ~14.7→12.9 kB.
- **v3.3** (current) — scalability pass on the schema + data layer: DB-side
  aggregate views (`branch_stats`/`employee_stats`, `security_invoker`) wired into
  `getBranchStats`/`getEmployeeStats` (no more client-side summing of all rows);
  `pg_trgm` GIN indexes for `ILIKE` search; global `(created_at)` indexes for the
  superadmin feeds; `(select auth.uid())` per-statement RLS; debounced history
  search (300 ms).

## 10. Known gaps / next
- Flip `AUTH_ENABLED`; back `useRole()` with the `profiles` table; drop the dev
  switcher.
- Server-side function (service role) to create real admin/user auth accounts.
- Optional next scale steps: keyset (cursor) pagination instead of offset+`count:
  'exact'` for very deep history; consider `owner_id` as `uuid` once auth is live;
  TIN-per-branch uniqueness constraint.
