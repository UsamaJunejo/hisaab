"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createUser } from "@/lib/books";
import { endSession, startSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string; v?: Record<string, string>; n?: number };
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function signup(_: FormState, f: FormData): Promise<FormState> {
  const r = await signupInner(f);
  return r.error ? { ...r, v: { name: s(f, "name"), email: s(f, "email"), phone: s(f, "phone"), country: s(f, "country"), plan: s(f, "plan"), level: s(f, "level") }, n: Date.now() } : r;
}

async function signupInner(f: FormData): Promise<FormState> {
  const name = s(f, "name"), email = s(f, "email"), phone = s(f, "phone"), country = s(f, "country") || "PK";
  const p1 = String(f.get("password") ?? ""), p2 = String(f.get("password2") ?? "");
  const plan = s(f, "plan") as "free" | "monthly" | "yearly";
  if (!name) return { error: "Please Enter Full Name" };
  if (!email) return { error: "Please Enter Valid Email" };
  if (!phone) return { error: "Please Enter Cell Number" };
  if (p1.length < 6) return { error: "Please Enter Password Comprising Of At Least 6 (Six) Characters." };
  if (p1 !== p2) return { error: "Passwords do not match." };
  if (!["free", "monthly", "yearly"].includes(plan)) return { error: "Please Select Your Package." };
  const level = Number(s(f, "level"));
  if (![1, 2, 3].includes(level)) return { error: "Please choose your accounting system (1, 2 or 3 level)." };
  if (f.get("accept") !== "on") return { error: "Please accept the Terms of Use." };
  let id: number;
  try {
    const d = await db();
    const ref = s(f, "ref");
    const [r] = ref ? await d.q<{ id: number }>("SELECT id FROM users WHERE customer_no = $1", [ref]) : [];
    id = await createUser(d, { name, email, phone, country, passwordHash: await bcrypt.hash(p1, 10), plan, referredBy: r?.id ?? null, level: level as 1 | 2 | 3 });
    await d.q("UPDATE invitations SET status = 'accepted' WHERE lower(email) = lower($1) AND status = 'pending'", [email]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Issues while registration" };
  }
  await startSession(id);
  redirect("/dashboard");
}

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const who = s(f, "username").toLowerCase();
  const pw = String(f.get("password") ?? "");
  const d = await db();
  const digits = who.replace(/\D/g, "");
  const [u] = await d.q<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = $1 OR ($2 <> '' AND regexp_replace(coalesce(phone, ''), '\\D', '', 'g') = $2) LIMIT 1",
    [who, digits.length >= 10 ? digits : ""],
  );
  if (!u || !(await bcrypt.compare(pw, u.password_hash))) return { error: "Invalid Username or Password; Try again", v: { username: s(f, "username") }, n: Date.now() };
  await startSession(u.id, f.get("remember") === "on");
  redirect("/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/");
}

/** Forgot password: makes a one-hour reset link. With no email service set up, the link is written to the server log. */
export async function forgot(_: FormState, f: FormData): Promise<FormState> {
  const email = s(f, "email").toLowerCase();
  const d = await db();
  const [u] = await d.q<{ id: number }>("SELECT id FROM users WHERE email = $1", [email]);
  if (u) {
    const token = randomBytes(24).toString("base64url");
    await d.q("INSERT INTO password_resets (token, user_id, expires_at) VALUES ($1, $2, now() + interval '1 hour')", [token, u.id]);
    console.log(`[password reset] ${email}: /forgot?token=${token}`);
  }
  return { ok: "If this email is registered, a password reset link has been sent to it." };
}

export async function resetPassword(_: FormState, f: FormData): Promise<FormState> {
  const token = s(f, "token");
  const p1 = String(f.get("password") ?? ""), p2 = String(f.get("password2") ?? "");
  if (p1.length < 6 || p1 !== p2) return { error: "Password not matched or enter password comprising of at least 6 (six) characters." };
  const d = await db();
  const [r] = await d.q<{ user_id: number }>("DELETE FROM password_resets WHERE token = $1 AND expires_at > now() RETURNING user_id", [token]);
  if (!r) return { error: "This link has expired. Please ask for a new one." };
  await d.q("UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE id = $2", [await bcrypt.hash(p1, 10), r.user_id]);
  return { ok: "Password changed. You can log in now." };
}
