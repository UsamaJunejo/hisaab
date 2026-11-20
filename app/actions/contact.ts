"use server";

import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export type ContactState = { ok?: string; error?: string; n?: number };

/** The home page's Contact form: saved for the admin (CEO Dashboard) and emailed to the admin when email is set up. */
export async function sendContact(_: ContactState, f: FormData): Promise<ContactState> {
  const g = (k: string) => String(f.get(k) ?? "").trim();
  const first = g("first"), last = g("last"), phone = g("phone"), email = g("email").toLowerCase(), company = g("company"), message = g("message");
  if (!first) return { error: "Please enter your first name" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email" };
  if (message.length < 5) return { error: "Please write your message" };
  const d = await db();
  await d.q("INSERT INTO contact_messages (first_name, last_name, phone, email, company, message) VALUES ($1, $2, $3, $4, $5, $6)",
    [first.slice(0, 100), last.slice(0, 100) || null, phone.slice(0, 40) || null, email.slice(0, 200), company.slice(0, 200) || null, message.slice(0, 4000)]);
  const [admin] = await d.q<{ email: string }>("SELECT email FROM users WHERE is_admin ORDER BY id LIMIT 1");
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  if (admin) await sendMail(admin.email, `Hisaab contact: ${first} ${last}`.trim(), `<p><b>${esc(first)} ${esc(last)}</b> (${esc(email)}${phone ? `, ${esc(phone)}` : ""}${company ? `, ${esc(company)}` : ""})</p><p>${esc(message).replace(/\n/g, "<br>")}</p>`).catch(() => false);
  return { ok: "Thank you! Your message has been sent. We will get back to you soon.", n: Date.now() };
}
