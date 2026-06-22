import type { CalcResult } from "./calc";
import { supabase } from "./supabase";
import { DEFAULT_INFLATION_RATE, DEFAULT_RENTAL_SHARE } from "../config";
import type { Branch, Role } from "../hooks/RoleContext";

// ---------------------------------------------------------------------------
// Persistence. Calculations + global settings round-trip through Supabase when
// configured, else localStorage. Branches/admins are local-only for now (the
// dev preview layer) until auth + the profiles table are activated — see
// tasks.md. Everything is paginated so 100+ users stay fast.
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
}

// A saved calculation, app-side shape (camelCase).
export interface HistoryItem extends CalcResult {
  id: string;
  createdAt: string;
  name: string | null;
  tin: string | null;
  businessType: string | null;
  branchId: string | null;
  locked: boolean; // fixed once printed — user can no longer edit/delete
  printedAt: string | null;
  voided: boolean; // admin removed a locked row (kept for the void trail)
  voidReason: string | null;
}

export interface HistoryScope {
  userId: string | null;
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
const BRANCHES_KEY = "branches";
const VOID_KEY = "void_log";
const DEFAULT_PAGE_SIZE = 20;

// ---- localStorage helpers --------------------------------------------------

function readLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(items: HistoryItem[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function localId(prefix = "local"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Apply role/branch visibility + search to a flat list (local mode + reuse).
function applyScope(all: HistoryItem[], scope: HistoryScope): HistoryItem[] {
  const q = scope.search?.trim().toLowerCase();
  return all.filter((it) => {
    if (scope.role === "admin" && scope.branchId && it.branchId !== scope.branchId)
      return false;
    if (!q) return true;
    return [it.name, it.tin, it.businessType]
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
    // Admins see their branch; users see their own rows (enforced by RLS too).
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

export interface VoidEntry {
  id: string;
  calcId: string;
  name: string | null;
  reason: string;
  branchId: string | null;
  at: string;
  acknowledged: boolean;
}

/** Admin voids a locked row; the trail is kept and surfaced to superadmins. */
export async function voidCalculation(
  userId: string | null,
  item: HistoryItem,
  reason: string
): Promise<void> {
  const at = new Date().toISOString();
  if (userId && supabase) {
    const { error } = await supabase.rpc("void_calculation", {
      p_calc_id: item.id,
      p_reason: reason,
    });
    if (error) throw error;
    return;
  }
  writeLocalHistory(
    readLocalHistory().map((h) =>
      h.id === item.id ? { ...h, voided: true, voidReason: reason } : h
    )
  );
  const log = readVoidLog();
  log.unshift({
    id: localId("void"),
    calcId: item.id,
    name: item.name,
    reason,
    branchId: item.branchId,
    at,
    acknowledged: false,
  });
  localStorage.setItem(VOID_KEY, JSON.stringify(log));
}

function readVoidLog(): VoidEntry[] {
  try {
    return JSON.parse(localStorage.getItem(VOID_KEY) || "[]") as VoidEntry[];
  } catch {
    return [];
  }
}

export async function getVoidLog(): Promise<VoidEntry[]> {
  return readVoidLog();
}

export async function acknowledgeVoid(id: string): Promise<void> {
  localStorage.setItem(
    VOID_KEY,
    JSON.stringify(
      readVoidLog().map((v) => (v.id === id ? { ...v, acknowledged: true } : v))
    )
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
  // Local: clear only unlocked rows so printed records survive.
  writeLocalHistory(readLocalHistory().filter((h) => h.locked));
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
          typeof p.rentalShare === "number"
            ? p.rentalShare
            : DEFAULT_RENTAL_SHARE,
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

// ---- Branches (dev/local preview layer) ------------------------------------

export function getBranches(): Branch[] {
  try {
    return JSON.parse(localStorage.getItem(BRANCHES_KEY) || "[]") as Branch[];
  } catch {
    return [];
  }
}

export function createBranch(name: string): Branch {
  const branch: Branch = { id: localId("branch"), name };
  localStorage.setItem(
    BRANCHES_KEY,
    JSON.stringify([...getBranches(), branch])
  );
  return branch;
}

export function deleteBranch(id: string): void {
  localStorage.setItem(
    BRANCHES_KEY,
    JSON.stringify(getBranches().filter((b) => b.id !== id))
  );
}

// ---- Aggregate stats (dashboards) ------------------------------------------
// Local/preview implementation. With Supabase live, back this with a SQL view
// or RPC that GROUP BYs branch_id so it stays O(branches), not O(rows).

export interface BranchStat {
  branchId: string | null;
  name: string;
  count: number;
  lastYearTax: number;
  garaagaruma: number;
  taaksii2018: number;
}

export async function getBranchStats(): Promise<BranchStat[]> {
  const branches = getBranches();
  const nameOf = (id: string | null) =>
    branches.find((b) => b.id === id)?.name ?? (id ? id : "—");
  const byBranch = new Map<string | null, BranchStat>();
  for (const it of readLocalHistory()) {
    if (it.voided) continue;
    const key = it.branchId;
    const stat =
      byBranch.get(key) ??
      {
        branchId: key,
        name: nameOf(key),
        count: 0,
        lastYearTax: 0,
        garaagaruma: 0,
        taaksii2018: 0,
      };
    stat.count += 1;
    stat.lastYearTax += it.lastYearTax;
    stat.garaagaruma += it.garaagaruma;
    stat.taaksii2018 += it.taaksiiBara2018;
    byBranch.set(key, stat);
  }
  return [...byBranch.values()].sort((a, b) => b.taaksii2018 - a.taaksii2018);
}
