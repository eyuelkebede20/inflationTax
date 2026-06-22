import type { HistoryItem } from "./storage";

// Encode a calculation into a self-contained shareable string (base64url of
// JSON). No backend / DB access needed — the link carries all the data, so it
// works for anyone, signed in or not.

// The fields needed to render the analysis (drop id; keep the rest).
type Shareable = Omit<HistoryItem, "id">;

function toBase64Url(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeShare(item: HistoryItem): string {
  const { id: _id, ...rest } = item;
  void _id;
  return toBase64Url(JSON.stringify(rest));
}

export function decodeShare(data: string): HistoryItem | null {
  try {
    const obj = JSON.parse(fromBase64Url(data)) as Shareable;
    if (typeof obj.taaksiiBara2018 !== "number") return null;
    return { ...obj, id: "shared" };
  } catch {
    return null;
  }
}

export function buildShareUrl(item: HistoryItem): string {
  return `${window.location.origin}/shared?d=${encodeShare(item)}`;
}
