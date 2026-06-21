import type { CalcResult } from "./calc";
import { supabase } from "./supabase";
import { DEFAULT_INFLATION_RATE } from "../config";

// A saved calculation, app-side shape (camelCase).
export interface HistoryItem extends CalcResult {
  id: string;
  createdAt: string;
  businessType: string | null;
}

const HISTORY_KEY = "calc_history";
const SETTINGS_KEY = "calc_settings";

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

function localId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- DB row mapping --------------------------------------------------------

interface DbRow {
  id: string;
  created_at: string;
  business_type: string | null;
  taxable: number;
  inflation_rate: number;
  inflated_amount: number;
  profit_tax_base: number;
  curfew_rate_base: number;
  curfew_base: number;
  total_base: number;
  profit_tax_infl: number;
  curfew_rate_infl: number;
  curfew_infl: number;
  total_infl: number;
  profit_tax_diff: number;
  curfew_diff: number;
  total_diff: number;
}

function rowToItem(r: DbRow): HistoryItem {
  return {
    id: r.id,
    createdAt: r.created_at,
    businessType: r.business_type,
    taxable: Number(r.taxable),
    inflationRate: Number(r.inflation_rate),
    inflatedAmount: Number(r.inflated_amount),
    profitTaxBase: Number(r.profit_tax_base),
    curfewRateBase: Number(r.curfew_rate_base),
    curfewBase: Number(r.curfew_base),
    totalBase: Number(r.total_base),
    profitTaxInfl: Number(r.profit_tax_infl),
    curfewRateInfl: Number(r.curfew_rate_infl),
    curfewInfl: Number(r.curfew_infl),
    totalInfl: Number(r.total_infl),
    profitTaxDiff: Number(r.profit_tax_diff),
    curfewDiff: Number(r.curfew_diff),
    totalDiff: Number(r.total_diff),
  };
}

function itemToInsert(userId: string, r: CalcResult, businessType: string | null) {
  return {
    user_id: userId,
    business_type: businessType,
    taxable: r.taxable,
    inflation_rate: r.inflationRate,
    inflated_amount: r.inflatedAmount,
    profit_tax_base: r.profitTaxBase,
    curfew_rate_base: r.curfewRateBase,
    curfew_base: r.curfewBase,
    total_base: r.totalBase,
    profit_tax_infl: r.profitTaxInfl,
    curfew_rate_infl: r.curfewRateInfl,
    curfew_infl: r.curfewInfl,
    total_infl: r.totalInfl,
    profit_tax_diff: r.profitTaxDiff,
    curfew_diff: r.curfewDiff,
    total_diff: r.totalDiff,
  };
}

// ---- History API -----------------------------------------------------------

export async function getHistory(userId: string | null): Promise<HistoryItem[]> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DbRow[]).map(rowToItem);
  }
  return readLocalHistory();
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
  businessType: string | null
): Promise<HistoryItem> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("calculations")
      .insert(itemToInsert(userId, result, businessType))
      .select("*")
      .single();
    if (error) throw error;
    return rowToItem(data as DbRow);
  }

  const item: HistoryItem = {
    ...result,
    id: localId(),
    createdAt: new Date().toISOString(),
    businessType,
  };
  const items = [item, ...readLocalHistory()];
  writeLocalHistory(items);
  return item;
}

export async function resetHistory(userId: string | null): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase
      .from("calculations")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }
  localStorage.removeItem(HISTORY_KEY);
}

// ---- Settings API ----------------------------------------------------------

export async function getInflationRate(userId: string | null): Promise<number> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("inflation_rate")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data) return Number(data.inflation_rate);
    return DEFAULT_INFLATION_RATE;
  }
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { inflationRate?: number };
      if (typeof parsed.inflationRate === "number") return parsed.inflationRate;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_INFLATION_RATE;
}

export async function setInflationRate(
  userId: string | null,
  rate: number
): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: userId, inflation_rate: rate, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ inflationRate: rate }));
}

// ---- Import local history into DB on first sign-in -------------------------

export async function importLocalHistory(userId: string): Promise<number> {
  if (!supabase) return 0;
  const local = readLocalHistory();
  if (local.length === 0) return 0;

  const rows = local.map((h) => ({
    ...itemToInsert(userId, h, h.businessType),
    created_at: h.createdAt,
  }));

  const { error } = await supabase.from("calculations").insert(rows);
  if (error) throw error;
  localStorage.removeItem(HISTORY_KEY);
  return rows.length;
}

export function hasLocalHistory(): boolean {
  return readLocalHistory().length > 0;
}
