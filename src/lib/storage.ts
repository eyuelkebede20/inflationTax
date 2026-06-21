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
  tax_2017_paid: number;
  sales_before: number;
  inflation_rate: number;
  rate_before: number;
  tax_before: number;
  sales_with: number;
  rate_with: number;
  tax_with: number;
  difference: number;
  tax_2018: number;
}

function rowToItem(r: DbRow): HistoryItem {
  return {
    id: r.id,
    createdAt: r.created_at,
    businessType: r.business_type,
    tax2017Paid: Number(r.tax_2017_paid),
    salesBefore: Number(r.sales_before),
    inflationRate: Number(r.inflation_rate),
    rateBefore: Number(r.rate_before),
    taxBefore: Number(r.tax_before),
    salesWith: Number(r.sales_with),
    rateWith: Number(r.rate_with),
    taxWith: Number(r.tax_with),
    difference: Number(r.difference),
    tax2018: Number(r.tax_2018),
  };
}

function itemToInsert(userId: string, result: CalcResult, businessType: string | null) {
  return {
    user_id: userId,
    business_type: businessType,
    tax_2017_paid: result.tax2017Paid,
    sales_before: result.salesBefore,
    inflation_rate: result.inflationRate,
    rate_before: result.rateBefore,
    tax_before: result.taxBefore,
    sales_with: result.salesWith,
    rate_with: result.rateWith,
    tax_with: result.taxWith,
    difference: result.difference,
    tax_2018: result.tax2018,
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
