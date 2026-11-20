import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db.ts";
import type { DateFormat } from "./format.ts";

const COOKIE = "hs_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production");
  return new TextEncoder().encode(s || "dev-only-secret-do-not-use-in-production");
}

export async function startSession(userId: number, remember = true) {
  const [u] = await (await db()).q<{ session_version: number }>("SELECT session_version FROM users WHERE id = $1", [userId]);
  const token = await new SignJWT({ uid: userId, sv: u?.session_version ?? 1 }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(remember ? { maxAge: MAX_AGE } : {}) });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export type User = {
  id: number; customer_no: string; name: string; email: string; phone: string | null; country: string; dob: string | null;
  is_admin: boolean; level: 1 | 2 | 3; currency: string; date_format: DateFormat; time24: boolean;
  show_name: boolean; show_email: boolean; show_phone: boolean; has_mpin: boolean; photo_v: string | null;
  plan: import("./billing.ts").PlanKey; plan_until: string; data_mb: number;
  nok_name: string | null; nok_email: string | null; nok_phone: string | null; nok_after_days: number | null; nok_interval_days: number | null; nok_times: number | null;
};

export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const d = await db();
    const [u] = await d.q<User & { session_version: number }>(
      `SELECT id, customer_no, name, email, phone, country, to_char(dob, 'YYYY-MM-DD') AS dob, is_admin, level, currency, date_format, time24,
              show_name, show_email, show_phone, mpin_hash IS NOT NULL AS has_mpin,
              CASE WHEN photo IS NULL THEN NULL ELSE extract(epoch FROM photo_at)::bigint::text END AS photo_v,
              plan, to_char(plan_until, 'YYYY-MM-DD') AS plan_until, data_mb, session_version,
              nok_name, nok_email, nok_phone, nok_after_days, nok_interval_days, nok_times
       FROM users WHERE id = $1`,
      [Number(payload.uid)],
    );
    if (!u || u.session_version !== Number(payload.sv ?? 1)) return null;
    await d.q("UPDATE users SET last_seen_at = now() WHERE id = $1 AND last_seen_at < now() - interval '10 minutes'", [u.id]);
    return u;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}
