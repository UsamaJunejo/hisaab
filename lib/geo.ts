import { headers } from "next/headers";
import type { Db } from "./db.ts";
import { COUNTRY } from "./countries.ts";
import { rateFor } from "./fx.ts";

/** The visitor's country: from Vercel's location header, else from the browser language (en-PK -> PK). */
export async function visitorCountry(): Promise<string | null> {
  const h = await headers();
  const v = h.get("x-vercel-ip-country");
  if (v && COUNTRY[v.toUpperCase()]) return v.toUpperCase();
  const m = /-([A-Za-z]{2})\b/.exec(h.get("accept-language") ?? "");
  return m && COUNTRY[m[1].toUpperCase()] ? m[1].toUpperCase() : null;
}

/** Prices are in USD (as on MunshiBaba). This gives the same price in the visitor's own currency, at today's rate,
 *  so a visitor in Pakistan sees "USD 1 (about PKR 280)". Null when they use USD or the rate can't be found. */
export async function localPricer(d: Db): Promise<((usdCents: number) => string) | null> {
  const c = await visitorCountry();
  const cur = c ? COUNTRY[c][3] : null;
  if (!cur || cur === "USD") return null;
  try {
    const perUsd = await rateFor(d, cur, "USD");
    return (cents) => `${cur} ${Math.round((cents / 100) * perUsd).toLocaleString("en-US")}`;
  } catch {
    return null;
  }
}
