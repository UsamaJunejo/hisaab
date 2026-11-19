import "server-only";
import { cookies } from "next/headers";
import { ALL, rangeFor, type FilterKey, type Range } from "./books.ts";
import { monthBounds, today } from "./format.ts";

/** The date filter is GLOBAL and sticky (like MunshiBaba): once chosen it applies to every level and report. */
export type Filter = { key: FilterKey; from?: string; to?: string };
const COOKIE = "hs_filter";

export async function getFilter(): Promise<Filter | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  try {
    return JSON.parse(v) as Filter;
  } catch {
    return null;
  }
}

/** The range to use on a page. With no filter chosen: dashboards use ALL TIME, statements use the current month. */
export async function pageRange(defaultTo: "all" | "month"): Promise<Range> {
  const f = await getFilter();
  if (f) return rangeFor(f.key, f);
  if (defaultTo === "all") return ALL;
  const [a, b] = monthBounds(today());
  return { from: a, to: b };
}

export async function setFilter(f: Filter | null) {
  const c = await cookies();
  if (!f || f.key === "all") c.set(COOKIE, JSON.stringify({ key: "all" }), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  else c.set(COOKIE, JSON.stringify(f), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}
