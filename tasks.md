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

## Round 2 — language + table to match the image
- [x] Dropped Amharic — app is now **English + Oromo only** (removed `am` dict,
      LANGS entry, `Lang` member). Default language is now Oromo (`om`).
- [x] Table column headers now use the **exact bilingual labels from the image**:
      EN ("Tax Payer Name", "Tax paid on 2017", "Sales before inflation", …) and
      OM ("Maqaa kafalaa Gibiraa", "Taaksii waliigala bara 2017 kafale",
      "Gurgurtaa qaala'iinsa gabaa duraa", …). Fixed the OM columns that were
      still showing English.
- [x] Two-tier header: the 6 inflation columns sit under a **"Taaksii 2018"**
      group, matching the spreadsheet.
- [x] Printed cards already render in the **currently selected language** (labels
      are resolved via `t()` at print time) — verified now that OM cards show the
      OM column names. Print subtitle = official title `Taaksii Kafalaa Gibiraa
      Sadarkaa "B" 2018`.

## Round 3 — hierarchy, user management, void approval, side dashboard
- [x] Hierarchy **superadmin → admin (branch manager) → user (employee)**.
      Identity-based dev switcher (pick superadmin / any admin / any employee).
- [x] **User management:** superadmin creates/removes admins; admins create/remove
      employees + reset their passwords (local preview accounts, plaintext stub).
- [x] **Void approval flow:** employee *requests* a void on a locked row → admin
      *approves/rejects* → superadmin sees all overall. Admins void directly.
- [x] Admin dashboard shows **per-employee branch summary** + approvals + team.
- [x] Superadmin **side dashboard** (Overview / Admins / Rates / Voids).
- [x] Entries carry `ownerId`/`ownerName`; scope = user→own, admin→branch, super→all.
- [x] Schema updated: `owner_name`, `void_requests`, `request_void`/`decide_void`
      RPCs, new RLS. **claude.md rewritten** as the living spec + changelog (v1→v3).
- [x] build green.

## Round 4 — fixes + superadmin drill-in + signed entries + QR
- [x] **Fixed Admin dashboard infinite loop** (memoized `me`; getAccount returned
      a new object each render → refresh effect looped → browser hung/crashed).
- [x] Inputs styled consistently (CSS now covers bare + search inputs; added
      `type="text"` in dashboards).
- [x] Main history table: **no horizontal scroll** — compact numbers (no "Birr"),
      wrapped headers, smaller font, fixed layout, wider action column.
- [x] Removed the "Before vs with inflation" analysis card.
- [x] **Superadmin → click an admin → manage that admin's employees** (shared
      `UserManager`; create/reset/remove). AdminDashboard refactored onto it too.
- [x] **Signed entries:** owner + transaction Ref ID on the printed card and the
      on-screen analysis; `owner_id` added to storage map + schema.
- [x] **QR code** on the printed card (self-contained share link, generated
      locally via lazy-loaded `qrcode` — own chunk, main bundle unchanged).
- [x] claude.md changelog → v3.1. build green.
- note: 2 pre-existing npm advisories are dev-only (vite/esbuild dev server),
      NOT from qrcode; fix needs a breaking vite 8 upgrade — left as-is.

## Round 5 — scalability review (schema + UI fit)
Verdict: foundation is solid; fixed the real gaps:
- [x] DB-side aggregate views `branch_stats`/`employee_stats` (`security_invoker`),
      wired into getBranchStats/getEmployeeStats — no more pulling all rows to sum.
- [x] `pg_trgm` GIN indexes on name/tin/business_type → fast ILIKE search at scale.
- [x] Global `(created_at)` indexes on calculations + void_requests (superadmin feeds).
- [x] RLS `(select auth.uid())` per-statement (Supabase perf best practice).
- [x] Debounced history search (300 ms).
Deferred (noted in claude.md §10): keyset pagination vs offset+count:exact for
very deep pages; owner_id → uuid when auth is live; TIN-per-branch uniqueness.

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
