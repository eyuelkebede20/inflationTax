import type { CalcResult } from "./calc";
import { supabase } from "./supabase";
import { DEFAULT_INFLATION_RATE, DEFAULT_RENTAL_SHARE } from "../config";
import type { Branch, Role } from "../hooks/RoleContext";

// ---------------------------------------------------------------------------
// Persistence. Calculations + global settings round-trip through Supabase when
// configured, else localStorage. The accounts/hierarchy layer is local-only
// PREVIEW for now (passwords are plaintext stubs) until auth + the profiles
// table are activated — see claude.md / tasks.md. Everything is paginated so
// 100+ users stay fast.
//
// Hierarchy: superadmin -> admins (each admin owns one branch / is its manager)
//            -> users (employees of that branch). Entries are owned by the user
//            who created them and carry their branch.
// ---------------------------------------------------------------------------

export interface AppSettings {
  inflationRate: number;
  rentalShare: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  inflationRate: DEFAULT_INFLATION_RATE,
  rentalShare: DEFAULT_RENTAL_SHARE,
};

export interface EntryMeta {
  name: string | null;
  tin: string | null;
  businessType: string | null;
  branchId: string | null;
  ownerId: string | null; // account (employee) that created the entry
  ownerName: string | null;
}

// A saved calculation, app-side shape (camelCase).
export interface HistoryItem extends CalcResult {
  id: string;
  createdAt: string;
  name: string | null;
  tin: string | null;
  businessType: string | null;
  branchId: string | null;
  ownerId: string | null;
  ownerName: string | null;
  locked: boolean; // fixed once printed — can no longer be edited/deleted
  printedAt: string | null;
  voided: boolean; // removed via an approved void (kept for the trail)
  voidReason: string | null;
}

export interface HistoryScope {
  userId: string | null; // Supabase auth id (live mode)
  accountId: string | null; // local preview account id
  role: Role;
  branchId: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface HistoryPage {
  items: HistoryItem[];
  total: number;
}

const HISTORY_KEY = "calc_history";
const SETTINGS_KEY = "app_settings";
const ACCOUNTS_KEY = "accounts";
const VOID_KEY = "void_requests";
const DEFAULT_PAGE_SIZE = 20;

export const SUPERADMIN_ID = "superadmin";

// ---- localStorage helpers --------------------------------------------------

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readLocalHistory(): HistoryItem[] {
  return readJson<HistoryItem[]>(HISTORY_KEY, []);
}

function writeLocalHistory(items: HistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function localId(prefix = "local"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Apply role/branch/owner visibility + search to a flat list.
function applyScope(all: HistoryItem[], scope: HistoryScope): HistoryItem[] {
  const q = scope.search?.trim().toLowerCase();
  return all.filter((it) => {
    if (scope.role === "admin" && scope.branchId && it.branchId !== scope.branchId)
      return false;
    if (scope.role === "user" && scope.accountId && it.ownerId !== scope.accountId)
      return false;
    if (!q) return true;
    return [it.name, it.tin, it.businessType, it.ownerName]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q));
  });
}

// ---- DB row mapping --------------------------------------------------------

interface DbRow {
  id: string;
  created_at: string;
  name: string | null;
  tin: string | null;
  business_type: string | null;
  branch_id: string | null;
  owner_id: string | null;
  owner_name: string | null;
  kind: string;
  turnover: number;
  last_year_tax: number;
  inflation_rate: number;
  rental_share: number;
  base: number;
  curfew_rate_before: number;
  tax_before: number;
  sales_with: number;
  curfew_rate_with: number;
  tax_with: number;
  garaagaruma: number;
  taaksii_2018: number;
  locked: boolean;
  printed_at: string | null;
  voided: boolean;
  void_reason: string | null;
}

function rowToItem(r: DbRow): HistoryItem {
  return {
    id: r.id,
    createdAt: r.created_at,
    name: r.name,
    tin: r.tin,
    businessType: r.business_type,
    branchId: r.branch_id,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    kind: r.kind === "rental" ? "rental" : "tax",
    turnover: Number(r.turnover),
    lastYearTax: Number(r.last_year_tax),
    inflationRate: Number(r.inflation_rate),
    rentalShare: Number(r.rental_share),
    base: Number(r.base),
    curfewRateBefore: Number(r.curfew_rate_before),
    taxBefore: Number(r.tax_before),
    salesWith: Number(r.sales_with),
    curfewRateWith: Number(r.curfew_rate_with),
    taxWith: Number(r.tax_with),
    garaagaruma: Number(r.garaagaruma),
    taaksiiBara2018: Number(r.taaksii_2018),
    locked: Boolean(r.locked),
    printedAt: r.printed_at,
    voided: Boolean(r.voided),
    voidReason: r.void_reason,
  };
}

function itemToInsert(userId: string, r: CalcResult, m: EntryMeta) {
  return {
    user_id: userId,
    name: m.name,
    tin: m.tin,
    business_type: m.businessType,
    branch_id: m.branchId,
    owner_id: m.ownerId ?? userId,
    owner_name: m.ownerName,
    kind: r.kind,
    turnover: r.turnover,
    last_year_tax: r.lastYearTax,
    inflation_rate: r.inflationRate,
    rental_share: r.rentalShare,
    base: r.base,
    curfew_rate_before: r.curfewRateBefore,
    tax_before: r.taxBefore,
    sales_with: r.salesWith,
    curfew_rate_with: r.curfewRateWith,
    tax_with: r.taxWith,
    garaagaruma: r.garaagaruma,
    taaksii_2018: r.taaksiiBara2018,
  };
}

// ---- History API -----------------------------------------------------------

export async function getHistory(scope: HistoryScope): Promise<HistoryPage> {
  const page = scope.page ?? 0;
  const pageSize = scope.pageSize ?? DEFAULT_PAGE_SIZE;

  if (scope.userId && supabase) {
    let query = supabase
      .from("calculations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (scope.role === "admin" && scope.branchId)
      query = query.eq("branch_id", scope.branchId);
    if (scope.search)
      query = query.or(
        `name.ilike.%${scope.search}%,tin.ilike.%${scope.search}%,business_type.ilike.%${scope.search}%`
      );
    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data as DbRow[]).map(rowToItem), total: count ?? 0 };
  }

  const filtered = applyScope(readLocalHistory(), scope);
  const start = page * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

export async function getCalculation(
  userId: string | null,
  id: string
): Promise<HistoryItem | null> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToItem(data as DbRow) : null;
  }
  return readLocalHistory().find((h) => h.id === id) ?? null;
}

export async function saveCalculation(
  userId: string | null,
  result: CalcResult,
  meta: EntryMeta
): Promise<HistoryItem> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("calculations")
      .insert(itemToInsert(userId, result, meta))
      .select("*")
      .single();
    if (error) throw error;
    return rowToItem(data as DbRow);
  }

  const item: HistoryItem = {
    ...result,
    ...meta,
    id: localId(),
    createdAt: new Date().toISOString(),
    locked: false,
    printedAt: null,
    voided: false,
    voidReason: null,
  };
  writeLocalHistory([item, ...readLocalHistory()]);
  return item;
}

/** Lock a row once it has been printed — it becomes fixed (idea #9). */
export async function markPrinted(
  userId: string | null,
  id: string
): Promise<void> {
  const printedAt = new Date().toISOString();
  if (userId && supabase) {
    const { error } = await supabase
      .from("calculations")
      .update({ locked: true, printed_at: printedAt })
      .eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocalHistory(
    readLocalHistory().map((h) =>
      h.id === id ? { ...h, locked: true, printedAt } : h
    )
  );
}

/** Hard delete — only allowed on unlocked rows (UI + RLS both enforce this). */
export async function deleteCalculation(
  userId: string | null,
  id: string
): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase
      .from("calculations")
      .delete()
      .eq("id", id)
      .eq("locked", false);
    if (error) throw error;
    return;
  }
  writeLocalHistory(
    readLocalHistory().filter((h) => !(h.id === id && !h.locked))
  );
}

export async function resetHistory(scope: HistoryScope): Promise<void> {
  if (scope.userId && supabase) {
    const { error } = await supabase
      .from("calculations")
      .delete()
      .eq("user_id", scope.userId)
      .eq("locked", false);
    if (error) throw error;
    return;
  }
  writeLocalHistory(readLocalHistory().filter((h) => h.locked));
}

// ---- Accounts / hierarchy (local preview) ----------------------------------

export interface Account {
  id: string;
  username: string;
  password: string; // PREVIEW ONLY: plaintext stub. Real auth = Supabase.
  role: "admin" | "user";
  branchId: string; // admin: own id; user: inherits manager's branch
  branchName: string;
  managerId: string | null; // user -> admin id; admin -> null
  fullName: string | null;
  createdAt: string;
}

function writeAccounts(list: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function getAccounts(): Account[] {
  return readJson<Account[]>(ACCOUNTS_KEY, []);
}

export function getAdmins(): Account[] {
  return getAccounts().filter((a) => a.role === "admin");
}

export function getUsersForManager(managerId: string): Account[] {
  return getAccounts().filter((a) => a.role === "user" && a.managerId === managerId);
}

export function usernameTaken(username: string): boolean {
  const u = username.trim().toLowerCase();
  return getAccounts().some((a) => a.username.toLowerCase() === u);
}

/** Superadmin creates an admin; the admin's id doubles as their branch id. */
export function createAdmin(input: {
  username: string;
  password: string;
  branchName: string;
  fullName?: string;
}): Account {
  const id = localId("admin");
  const admin: Account = {
    id,
    username: input.username.trim(),
    password: input.password,
    role: "admin",
    branchId: id,
    branchName: input.branchName.trim() || input.username.trim(),
    managerId: null,
    fullName: input.fullName?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...getAccounts(), admin]);
  return admin;
}

/** An admin creates an employee under their branch. */
export function createUser(
  manager: Account,
  input: { username: string; password: string; fullName?: string }
): Account {
  const user: Account = {
    id: localId("user"),
    username: input.username.trim(),
    password: input.password,
    role: "user",
    branchId: manager.branchId,
    branchName: manager.branchName,
    managerId: manager.id,
    fullName: input.fullName?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...getAccounts(), user]);
  return user;
}

/** Remove an account; removing an admin cascades to their employees. */
export function removeAccount(id: string): void {
  writeAccounts(getAccounts().filter((a) => a.id !== id && a.managerId !== id));
}

export function setPassword(id: string, password: string): void {
  writeAccounts(
    getAccounts().map((a) => (a.id === id ? { ...a, password } : a))
  );
}

export function getAccount(id: string | null): Account | null {
  if (!id) return null;
  return getAccounts().find((a) => a.id === id) ?? null;
}

// Branches are derived from admins (branch = admin).
export function getBranches(): Branch[] {
  return getAdmins().map((a) => ({ id: a.branchId, name: a.branchName }));
}

// ---- Void requests + approval flow -----------------------------------------

export type VoidStatus = "pending" | "approved" | "rejected";

export interface VoidRequest {
  id: string;
  calcId: string;
  calcName: string | null;
  branchId: string | null;
  requestedById: string | null;
  requestedByName: string | null;
  reason: string;
  status: VoidStatus;
  decidedByName: string | null;
  decidedAt: string | null;
  createdAt: string;
}

function readVoids(): VoidRequest[] {
  return readJson<VoidRequest[]>(VOID_KEY, []);
}

function writeVoids(list: VoidRequest[]): void {
  localStorage.setItem(VOID_KEY, JSON.stringify(list));
}

function setVoided(calcId: string, reason: string): void {
  writeLocalHistory(
    readLocalHistory().map((h) =>
      h.id === calcId ? { ...h, voided: true, voidReason: reason } : h
    )
  );
}

/** Employee asks to void a locked entry — pending until an admin approves. */
export function requestVoid(
  item: HistoryItem,
  requester: { id: string; name: string },
  reason: string
): VoidRequest {
  const req: VoidRequest = {
    id: localId("void"),
    calcId: item.id,
    calcName: item.name,
    branchId: item.branchId,
    requestedById: requester.id,
    requestedByName: requester.name,
    reason,
    status: "pending",
    decidedByName: null,
    decidedAt: null,
    createdAt: new Date().toISOString(),
  };
  writeVoids([req, ...readVoids()]);
  return req;
}

/** Admin voids directly (counts as a self-approved request). */
export function voidDirect(
  item: HistoryItem,
  decider: { name: string },
  reason: string
): void {
  const req: VoidRequest = {
    id: localId("void"),
    calcId: item.id,
    calcName: item.name,
    branchId: item.branchId,
    requestedById: null,
    requestedByName: decider.name,
    reason,
    status: "approved",
    decidedByName: decider.name,
    decidedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  writeVoids([req, ...readVoids()]);
  setVoided(item.id, reason);
}

export function approveVoid(reqId: string, decider: { name: string }): void {
  const at = new Date().toISOString();
  let target: VoidRequest | undefined;
  writeVoids(
    readVoids().map((v) => {
      if (v.id !== reqId) return v;
      target = v;
      return { ...v, status: "approved", decidedByName: decider.name, decidedAt: at };
    })
  );
  if (target) setVoided(target.calcId, target.reason);
}

export function rejectVoid(reqId: string, decider: { name: string }): void {
  const at = new Date().toISOString();
  writeVoids(
    readVoids().map((v) =>
      v.id === reqId
        ? { ...v, status: "rejected", decidedByName: decider.name, decidedAt: at }
        : v
    )
  );
}

export interface VoidScope {
  role: Role;
  branchId: string | null;
}

/** Admin sees their branch's requests; superadmin sees all. Pending first. */
export function getVoidRequests(scope: VoidScope): VoidRequest[] {
  const all = readVoids().filter((v) =>
    scope.role === "superadmin" ? true : v.branchId === scope.branchId
  );
  const rank = (s: VoidStatus) => (s === "pending" ? 0 : 1);
  return all.sort(
    (a, b) =>
      rank(a.status) - rank(b.status) || b.createdAt.localeCompare(a.createdAt)
  );
}

// ---- Settings API (global, superadmin-managed) -----------------------------

export async function getAppSettings(): Promise<AppSettings> {
  if (supabase) {
    const { data, error } = await supabase
      .from("app_settings")
      .select("inflation_rate, rental_share")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) {
      return {
        inflationRate: Number(data.inflation_rate),
        rentalShare: Number(data.rental_share),
      };
    }
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      const p = JSON.parse(raw) as Partial<AppSettings>;
      return {
        inflationRate:
          typeof p.inflationRate === "number"
            ? p.inflationRate
            : DEFAULT_INFLATION_RATE,
        rentalShare:
          typeof p.rentalShare === "number" ? p.rentalShare : DEFAULT_RENTAL_SHARE,
      };
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_SETTINGS;
}

export async function setAppSettings(s: AppSettings): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("app_settings").upsert({
      id: 1,
      inflation_rate: s.inflationRate,
      rental_share: s.rentalShare,
      updated_at: new Date().toISOString(),
    });
    if (!error) return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ---- Aggregate stats (dashboards) ------------------------------------------
// Local/preview implementation. With Supabase live, back this with a SQL view
// or RPC that GROUP BYs branch_id so it stays O(branches), not O(rows).

export interface StatRow {
  id: string | null;
  name: string;
  count: number;
  lastYearTax: number;
  garaagaruma: number;
  taaksii2018: number;
}

function aggregate(
  items: HistoryItem[],
  keyOf: (it: HistoryItem) => string | null,
  nameOf: (key: string | null) => string
): StatRow[] {
  const by = new Map<string | null, StatRow>();
  for (const it of items) {
    if (it.voided) continue;
    const key = keyOf(it);
    const row =
      by.get(key) ??
      { id: key, name: nameOf(key), count: 0, lastYearTax: 0, garaagaruma: 0, taaksii2018: 0 };
    row.count += 1;
    row.lastYearTax += it.lastYearTax;
    row.garaagaruma += it.garaagaruma;
    row.taaksii2018 += it.taaksiiBara2018;
    by.set(key, row);
  }
  return [...by.values()].sort((a, b) => b.taaksii2018 - a.taaksii2018);
}

interface StatViewRow {
  branch_id: string | null;
  branch_name?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  count: number;
  last_year_tax: number;
  garaagaruma: number;
  taaksii_2018: number;
}

function viewToStat(r: StatViewRow, idKey: "branch_id" | "owner_id"): StatRow {
  return {
    id: r[idKey] ?? null,
    name: (idKey === "branch_id" ? r.branch_name : r.owner_name) ?? r[idKey] ?? "—",
    count: Number(r.count),
    lastYearTax: Number(r.last_year_tax),
    garaagaruma: Number(r.garaagaruma),
    taaksii2018: Number(r.taaksii_2018),
  };
}

/** Superadmin overview: one row per branch (DB-aggregated via the branch_stats view). */
export async function getBranchStats(): Promise<StatRow[]> {
  if (supabase) {
    const { data, error } = await supabase.from("branch_stats").select("*");
    if (!error && data) {
      return (data as StatViewRow[])
        .map((r) => viewToStat(r, "branch_id"))
        .sort((a, b) => b.taaksii2018 - a.taaksii2018);
    }
  }
  const branches = getBranches();
  const nameOf = (id: string | null) =>
    branches.find((b) => b.id === id)?.name ?? (id || "—");
  return aggregate(readLocalHistory(), (it) => it.branchId, nameOf);
}

/** Admin view: one row per employee within a branch (DB-aggregated via employee_stats). */
export async function getEmployeeStats(branchId: string | null): Promise<StatRow[]> {
  if (supabase) {
    let q = supabase.from("employee_stats").select("*");
    if (branchId) q = q.eq("branch_id", branchId);
    const { data, error } = await q;
    if (!error && data) {
      return (data as StatViewRow[])
        .map((r) => viewToStat(r, "owner_id"))
        .sort((a, b) => b.taaksii2018 - a.taaksii2018);
    }
  }
  const items = readLocalHistory().filter((it) => !branchId || it.branchId === branchId);
  return aggregate(
    items,
    (it) => it.ownerId,
    (id) => items.find((it) => it.ownerId === id)?.ownerName || "—"
  );
}
