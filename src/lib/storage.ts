import type { CalcResult } from "./calc";
import { supabase } from "./supabase";
import { DEFAULT_INFLATION_RATE } from "../config";

// A saved calculation, app-side shape (camelCase).
export interface HistoryItem extends CalcResult {
  id: string;
  createdAt: string;
  label: string | null;
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
  label: string | null;
  taxable_2017: number;
  inflation_rate: number;
  taxable_2016: number;
  profit_tax_2016: number;
  profit_tax_2017: number;
  schedule_rate_2016: number;
  schedule_rate_2017: number;
  curfew_2016: number;
  curfew_2017: number;
}

function rowToItem(r: DbRow): HistoryItem {
  return {
    id: r.id,
    createdAt: r.created_at,
    label: r.label,
    taxable2017: Number(r.taxable_2017),
    inflationRate: Number(r.inflation_rate),
    taxable2016: Number(r.taxable_2016),
    profitTax2016: Number(r.profit_tax_2016),
    profitTax2017: Number(r.profit_tax_2017),
    rate2016: Number(r.schedule_rate_2016),
    rate2017: Number(r.schedule_rate_2017),
    curfew2016: Number(r.curfew_2016),
    curfew2017: Number(r.curfew_2017),
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
  label: string | null
): Promise<HistoryItem> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("calculations")
      .insert({
        user_id: userId,
        label,
        taxable_2017: result.taxable2017,
        inflation_rate: result.inflationRate,
        taxable_2016: result.taxable2016,
        profit_tax_2016: result.profitTax2016,
        profit_tax_2017: result.profitTax2017,
        schedule_rate_2016: result.rate2016,
        schedule_rate_2017: result.rate2017,
        curfew_2016: result.curfew2016,
        curfew_2017: result.curfew2017,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToItem(data as DbRow);
  }

  const item: HistoryItem = {
    ...result,
    id: localId(),
    createdAt: new Date().toISOString(),
    label,
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
    user_id: userId,
    label: h.label,
    created_at: h.createdAt,
    taxable_2017: h.taxable2017,
    inflation_rate: h.inflationRate,
    taxable_2016: h.taxable2016,
    profit_tax_2016: h.profitTax2016,
    profit_tax_2017: h.profitTax2017,
    schedule_rate_2016: h.rate2016,
    schedule_rate_2017: h.rate2017,
    curfew_2016: h.curfew2016,
    curfew_2017: h.curfew2017,
  }));

  const { error } = await supabase.from("calculations").insert(rows);
  if (error) throw error;
  localStorage.removeItem(HISTORY_KEY);
  return rows.length;
}

export function hasLocalHistory(): boolean {
  return readLocalHistory().length > 0;
}
