// Formatting shared by server and browser.

/** 347164100 paisa -> "3,471,641.00" (always 2 decimals, 3-digit groups, minus sign). */
export function money(paisa: number): string {
  const neg = paisa < 0;
  const s = (Math.abs(paisa) / 100).toFixed(2);
  const [i, f] = s.split(".");
  return (neg ? "-" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + f;
}

/** Tiles show a negative balance in brackets without the minus: (3,471,641.00). */
export function moneyTile(paisa: number): string {
  return paisa < 0 ? `(${money(-paisa)})` : money(paisa);
}

/** "1,234.5" / "1234" -> paisa, or NaN. */
export function toPaisa(s: string | null | undefined): number {
  const t = String(s ?? "").replace(/,/g, "").trim();
  if (!/^-?\d+(\.\d{0,3})?$/.test(t)) return NaN;
  return Math.round(Number(t) * 100);
}

export type DateFormat = "DD-MM-YYYY" | "MM-DD-YYYY" | "YYYY-MM-DD";
export const DATE_FORMATS: DateFormat[] = ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"];

/** "2026-11-19" -> user's chosen format. */
export function fmtDate(iso: string | null | undefined, f: DateFormat = "DD-MM-YYYY"): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return f === "YYYY-MM-DD" ? `${y}-${m}-${d}` : f === "MM-DD-YYYY" ? `${m}-${d}-${y}` : `${d}-${m}-${y}`;
}

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** "2026-11-01" -> "01 NOV 2026" (report headers). */
export function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d} ${MON[Number(m) - 1]} ${y}`;
}

const Mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-11-20" -> "20 Nov 2026" (the "Print Date" on statements, as MunshiBaba writes it). */
export function printDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d} ${Mon[Number(m) - 1]} ${y}`;
}

/** "2026-11-06" -> "2026.11.06" (voucher history, as MunshiBaba writes it). */
export const dotDate = (iso: string) => iso.slice(0, 10).replaceAll("-", ".");

/** "2026-11-19T14:05:00" -> "02:05:00 PM" or "14:05:00". */
export function fmtTime(ts: string | Date, time24: boolean): string {
  const t = typeof ts === "string" ? new Date(ts) : ts;
  const h = t.getHours(), m = String(t.getMinutes()).padStart(2, "0"), s = String(t.getSeconds()).padStart(2, "0");
  if (time24) return `${String(h).padStart(2, "0")}:${m}:${s}`;
  return `${String(h % 12 || 12).padStart(2, "0")}:${m}:${s} ${h < 12 ? "AM" : "PM"}`;
}

/** Today in Pakistan time as YYYY-MM-DD. */
export function today(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

export function monthBounds(iso: string): [string, string] {
  const [y, m] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${y}-${String(m).padStart(2, "0")}-01`, `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`];
}
