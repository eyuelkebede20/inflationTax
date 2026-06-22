import type { CalcResult } from "./calc";
import { supabase } from "./supabase";
import { DEFAULT_INFLATION_RATE, DEFAULT_TOT_RATE, DEFAULT_PROFIT_MARGIN } from "../config";

export interface AppSettings {
  inflationRate: number;
  totRate: number;
  profitMargin: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  inflationRate: DEFAULT_INFLATION_RATE,
  totRate: DEFAULT_TOT_RATE,
  profitMargin: DEFAULT_PROFIT_MARGIN,
};

// A saved calculation, app-side shape (camelCase).
export interface HistoryItem extends CalcResult {
  id: string;
  createdAt: string;
  name: string | null;
  tin: string | null;
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
  name: string | null;
  tin: string | null;
  business_type: string | null;
  turnover: number;
  inflation_rate: number;
  tot_rate: number;
  profit_margin: number;
  is_service: boolean;
  profit_base: number;
  profit_tax_amt: number;
  tot: number;
  last_year_tax: number;
  last_year_tax_manual: boolean;
  curfew_rate_before: number;
  tax_before: number;
  sales_with: number;
  curfew_rate_with: number;
  tax_with: number;
  garaagaruma: number;
  taaksii_2018: number;
}

function rowToItem(r: DbRow): HistoryItem {
  return {
    id: r.id,
    createdAt: r.created_at,
    name: r.name,
    tin: r.tin,
    businessType: r.business_type,
    turnover: Number(r.turnover),
    inflationRate: Number(r.inflation_rate),
    totRate: Number(r.tot_rate),
    profitMargin: Number(r.profit_margin),
    isService: Boolean(r.is_service),
    profitBase: Number(r.profit_base),
    profitTaxAmt: Number(r.profit_tax_amt),
    tot: Number(r.tot),
    lastYearTax: Number(r.last_year_tax),
    lastYearTaxManual: Boolean(r.last_year_tax_manual),
    curfewRateBefore: Number(r.curfew_rate_before),
    taxBefore: Number(r.tax_before),
    salesWith: Number(r.sales_with),
    curfewRateWith: Number(r.curfew_rate_with),
    taxWith: Number(r.tax_with),
    garaagaruma: Number(r.garaagaruma),
    taaksiiBara2018: Number(r.taaksii_2018),
  };
}

interface Meta {
  name: string | null;
  tin: string | null;
  businessType: string | null;
}

function itemToInsert(userId: string, r: CalcResult, m: Meta) {
  return {
    user_id: userId,
    name: m.name,
    tin: m.tin,
    business_type: m.businessType,
    turnover: r.turnover,
    inflation_rate: r.inflationRate,
    tot_rate: r.totRate,
    profit_margin: r.profitMargin,
    is_service: r.isService,
    profit_base: r.profitBase,
    profit_tax_amt: r.profitTaxAmt,
    tot: r.tot,
    last_year_tax: r.lastYearTax,
    last_year_tax_manual: r.lastYearTaxManual,
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
  meta: Meta
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
    id: localId(),
    createdAt: new Date().toISOString(),
    ...meta,
  };
  const items = [item, ...readLocalHistory()];
  writeLocalHistory(items);
  return item;
}

export async function deleteCalculation(
  userId: string | null,
  id: string
): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase.from("calculations").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const items = readLocalHistory().filter((h) => h.id !== id);
  writeLocalHistory(items);
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

export async function getSettings(userId: string | null): Promise<AppSettings> {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("inflation_rate, tot_rate, profit_margin")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return {
        inflationRate: Number(data.inflation_rate),
        totRate: data.tot_rate != null ? Number(data.tot_rate) : DEFAULT_TOT_RATE,
        profitMargin:
          data.profit_margin != null
            ? Number(data.profit_margin)
            : DEFAULT_PROFIT_MARGIN,
      };
    }
    return DEFAULT_SETTINGS;
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
        totRate: typeof p.totRate === "number" ? p.totRate : DEFAULT_TOT_RATE,
        profitMargin:
          typeof p.profitMargin === "number"
            ? p.profitMargin
            : DEFAULT_PROFIT_MARGIN,
      };
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_SETTINGS;
}

export async function setSettings(
  userId: string | null,
  s: AppSettings
): Promise<void> {
  if (userId && supabase) {
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        inflation_rate: s.inflationRate,
        tot_rate: s.totRate,
        profit_margin: s.profitMargin,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ---- Import local history into DB on first sign-in -------------------------

export async function importLocalHistory(userId: string): Promise<number> {
  if (!supabase) return 0;
  const local = readLocalHistory();
  if (local.length === 0) return 0;

  const rows = local.map((h) => ({
    ...itemToInsert(userId, h, {
      name: h.name,
      tin: h.tin,
      businessType: h.businessType,
    }),
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
