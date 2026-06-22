# tasks.md — working notes (Claude)

Scope: refactor for scale (100+ users), security, kill dead code, apply
`claude.ideas.md` + the Schedule-"B" 2018 table, seed a superadmin, and stand up
user / admin / superadmin dashboards in nav (auth scaffolded but **commented** for now).

## Decisions / assumptions (confirm with user)
- **A1 — Logic.** Both `turnover` (Sales before inflation, col F) **and** `lastYearTax`
  (Tax paid 2017, col E) are now **required** inputs. Curfew is computed on a `base`:
  - kind `tax`  → base = turnover
  - kind `rental` → base = 50% of turnover (idea #7)
  - taxBefore (G) = base × scheduleRate(base)
  - salesWith (H) = base × (1 + inflation)
  - taxWith (I)   = salesWith × scheduleRate(salesWith)
  - garaagaruma (J) = I − G
  - taaksii2018 (K) = E + J
  Matches the table image columns exactly.
- **A2 — Dead code killed.** `profitTax`, TOT, `profitMargin`, `turnoverFromTax`,
  `lastYearTaxFromTurnover`, `isService` removed. Replaced by `kind` + `rentalShare`.
- **A3 — Roles.** superadmin / admin / user. Branches owned by admins (named). Auth
  **not enforced yet** — a dev Role/Branch switcher in nav previews all 3 dashboards.
  Full schema + RLS + seed written for later activation.
- **A4 — Required:** Name, TIN, Sales/Turnover, Last-year tax. Optional: Business type.
- **A5 — Lock on print.** Printing a row sets `printed_at` + `locked=true`; user may
  delete only while unlocked. Admin may **void** a locked row (kept in `void_log`);
  superadmin is notified.
- **A6 — Inflation / rental-share** move to a global app_settings managed in the
  superadmin dashboard. Profile slimmed to change-password only (idea #6).
- **A7 — Pagination** on history (range-based when DB, slice when local).
- **A8 — Scale:** lazy-loaded route chunks, DB indexes, range pagination, single
  client, keep-warm. 100+ users → branch_id + created_at indexes.

## Plan / status
- [x] Read whole codebase + ideas + logic + table image
- [x] tasks.md
- [x] calc.ts — new engine, killed profitTax/TOT/margin/back-solve/isService
- [x] config.ts — rentalShare default, AUTH_ENABLED flag, dropped TOT/margin
- [x] roles context (dev switcher) + types (hooks/RoleContext.tsx)
- [x] storage.ts — new schema map, range pagination, branch/lock/void, app_settings, branch stats
- [x] DataInput — renamed, required (name/TIN/sales/last-tax), Tax/Rental segmented toggle
- [x] Home — dropped hero + why-it-matters; input + history + pagination
- [x] HistoryList — pagination, print-card-locks-row, delete-until-locked, admin void, full-report print
- [x] Nav — Dashboard/Admin/Superadmin links + dev role/branch switcher; auth gated by AUTH_ENABLED
- [x] Admin dashboard (branch totals)
- [x] Superadmin dashboard (branches CRUD, global rates, branch analytics, void feed)
- [x] Profile — slim to change-password only
- [x] AnalysisBoard / Analysis — adapted to base/kind, removed TOT/profit cards
- [x] i18n — added v2 keys in en/am/om
- [x] supabase/schema.sql (roles, branches, app_settings, void_log, RLS, indexes, void RPC) + seed.sql (superadmin)
- [x] App.tsx routes + React.lazy code-splitting
- [x] build (tsc + vite) green — dashboards/auth/analysis are separate chunks

## Remaining / follow-ups (not done this pass)
- [ ] **Activate auth.** Flip `AUTH_ENABLED` in config.ts, wire `profiles` to a
      real `useRole()` (read signed-in user's role/branch), remove the dev switcher.
- [ ] **Create admins with passwords** (idea #8) — needs a server-side function
      (service-role key) to call `auth.admin.createUser`. Branches CRUD is local
      preview only right now; admins/users assignment is not persisted to DB yet.
- [ ] **DB-backed branch stats & void feed** — currently computed from localStorage.
      Replace `getBranchStats`/`getVoidLog` with a SQL view / RPC once auth is on.
- [ ] **claude.md is stale** — its section 3 (TOT + profit tax, taxable2017) is the
      old model. The live model is claude.logic.md + the table. Update before sharing.
- [ ] Debounce history search input (currently refetches per keystroke).
- [ ] Consider a DB unique constraint on TIN per branch if duplicates matter.

## Open questions for user
1. Superadmin seed username/password? Using `superadmin` / temp pwd in seed.sql —
   change before real deploy.
2. Rental share fixed at 50%? Exposed as a setting, default 0.5.
3. "Sales before inflation" column for rental — show the 50% base (current choice)
   or the full entered income?
