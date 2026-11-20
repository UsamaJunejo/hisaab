import bcrypt from "bcryptjs";
import type { Db } from "./db.ts";
import { seedDefaults } from "./books.ts";
import { DATE_FORMATS, type DateFormat } from "./format.ts";
import { isCurrency } from "./currencies.ts";
import { PLANS, isGroupPlan } from "./billing.ts";

// ---------------------------------------------------------------- settings

export async function saveSettings(d: Db, userId: number, s: { currency: string; country: string; dateFormat: string; time24: boolean }) {
  if (!isCurrency(s.currency)) throw new Error("Please choose a currency");
  if (!DATE_FORMATS.includes(s.dateFormat as DateFormat)) throw new Error("Please choose a date format");
  await d.q("UPDATE users SET currency = $1, country = $2, date_format = $3, time24 = $4 WHERE id = $5", [s.currency, s.country || "PK", s.dateFormat, s.time24, userId]);
}

/** Switch between the 1, 2 and 3 level systems. The data underneath stays the same; only the view changes. */
export async function switchLevel(d: Db, userId: number, level: number) {
  if (![1, 2, 3].includes(level)) throw new Error("Please Select Level to Switch");
  await d.q("UPDATE users SET level = $1 WHERE id = $2", [level, userId]);
}

/** Delete every entry, account, sub-category and category, then put the ready-made chart back. */
export async function resetAccount(d: Db, userId: number) {
  await d.tx(async (t) => {
    await t.q("DELETE FROM shares WHERE owner_id = $1 OR shared_with = $1", [userId]);
    await t.q("DELETE FROM budgets WHERE user_id = $1", [userId]);
    await t.q("DELETE FROM attachments WHERE user_id = $1 OR entry_id IN (SELECT e.id FROM entries e JOIN accounts a ON a.id IN (e.from_account_id, e.to_account_id) WHERE a.user_id = $1)", [userId]);
    await t.q("DELETE FROM entries WHERE user_id = $1 OR from_account_id IN (SELECT id FROM accounts WHERE user_id = $1) OR to_account_id IN (SELECT id FROM accounts WHERE user_id = $1)", [userId]);
    await t.q("DELETE FROM accounts WHERE user_id = $1", [userId]);
    await t.q("DELETE FROM subcategories WHERE user_id = $1", [userId]);
    await t.q("DELETE FROM categories WHERE user_id = $1", [userId]);
    await t.q("DELETE FROM notifications WHERE user_id = $1 AND kind <> 'alert'", [userId]);
    await seedDefaults(t, userId);
  });
}

// ---------------------------------------------------------------- profile

export async function saveProfile(d: Db, userId: number, p: { name: string; email: string; phone: string; country: string; dob: string | null; showName: boolean; showEmail: boolean; showPhone: boolean }) {
  const name = p.name.trim(), email = p.email.trim().toLowerCase(), phone = p.phone.replace(/[^\d+]/g, "");
  if (!name) throw new Error("Please Enter Full Name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Please enter valid email or cell number with at least 10 digits");
  if (phone && phone.replace(/\D/g, "").length < 10) throw new Error("Please enter valid email or cell number with at least 10 digits");
  const [dup] = await d.q("SELECT 1 FROM users WHERE id <> $1 AND (email = $2 OR ($3 <> '' AND phone = $3))", [userId, email, phone]);
  if (dup) throw new Error("This email or cell number is already used by another account");
  await d.q("UPDATE users SET name = $1, email = $2, phone = $3, country = $4, dob = $5, show_name = $6, show_email = $7, show_phone = $8 WHERE id = $9",
    [name, email, phone || null, p.country || "PK", p.dob || null, p.showName, p.showEmail, p.showPhone, userId]);
}

export async function changePassword(d: Db, userId: number, current: string, p1: string, p2: string) {
  if (p1.length < 6 || p1 !== p2) throw new Error("Password not matched or enter password comprising of at least 6 (six) characters.");
  const [u] = await d.q<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [userId]);
  if (!(await bcrypt.compare(current, u.password_hash))) throw new Error("Your current password is not right");
  await d.q("UPDATE users SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(p1, 10), userId]);
}

export async function setMpin(d: Db, userId: number, a: string, b: string) {
  if (!/^\d{4}$/.test(a)) throw new Error("Please Enter 4 Digit MPIN.");
  if (a !== b) throw new Error("MPIN Not Matched.");
  await d.q("UPDATE users SET mpin_hash = $1 WHERE id = $2", [await bcrypt.hash(a, 10), userId]);
}

export async function checkMpin(d: Db, userId: number, pin: string) {
  const [u] = await d.q<{ mpin_hash: string | null }>("SELECT mpin_hash FROM users WHERE id = $1", [userId]);
  if (!u.mpin_hash) throw new Error("Please set your 4 digit M-PIN in My Account > Profile first.");
  if (!(await bcrypt.compare(pin, u.mpin_hash))) throw new Error("MPIN Not Matched.");
}

export async function savePhoto(d: Db, userId: number, data: Buffer | null) {
  if (data && data.length > 2 * 1024 * 1024) throw new Error("The picture is too big (2 MB max).");
  await d.q("UPDATE users SET photo = $1, photo_at = now() WHERE id = $2", [data, userId]);
}

// ---------------------------------------------------------------- next of kin

export async function saveNok(d: Db, userId: number, n: { name: string; email: string; phone: string; after: number; interval: number; times: number }) {
  if (n.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(n.email)) throw new Error("Please enter a valid email for your next of kin");
  if (![90, 180, 365].includes(n.after)) throw new Error("Please choose after how long the nominee should be told");
  if (!(n.interval >= 1 && n.interval <= 60) || !(n.times >= 1 && n.times <= 10)) throw new Error("Please enter how often (1-60 days) and how many times (1-10)");
  await d.q("UPDATE users SET nok_name = $1, nok_email = $2, nok_phone = $3, nok_after_days = $4, nok_interval_days = $5, nok_times = $6 WHERE id = $7",
    [n.name.trim() || null, n.email.trim() || null, n.phone.trim() || null, n.after, n.interval, n.times, userId]);
}

// ---------------------------------------------------------------- projects

export async function projects(d: Db, userId: number) {
  return d.q<{ id: number; name: string }>("SELECT id, name FROM projects WHERE user_id = $1 ORDER BY name", [userId]);
}
export async function saveProject(d: Db, userId: number, id: number, name: string) {
  const n = name.trim();
  if (!n) throw new Error("Please enter the project name");
  const [dup] = await d.q("SELECT 1 FROM projects WHERE user_id = $1 AND lower(name) = lower($2) AND id <> $3", [userId, n, id]);
  if (dup) throw new Error("A project with this name already exists");
  if (id) await d.q("UPDATE projects SET name = $1 WHERE id = $2 AND user_id = $3", [n, id, userId]);
  else await d.q("INSERT INTO projects (user_id, name) VALUES ($1, $2)", [userId, n]);
}
export async function deleteProject(d: Db, userId: number, id: number) {
  await d.q("DELETE FROM projects WHERE id = $1 AND user_id = $2", [id, userId]);
}

// ---------------------------------------------------------------- invitations & group license

export async function invite(d: Db, userId: number, i: { name: string; email: string; phone: string; country: string }) {
  const email = i.email.trim().toLowerCase();
  if (!i.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Please enter the name and a valid email");
  const [reg] = await d.q("SELECT 1 FROM users WHERE email = $1", [email]);
  if (reg) throw new Error("This email is already registered as a user. Please search in SHARE ACCOUNT.");
  await d.q("INSERT INTO invitations (user_id, name, email, phone, country) VALUES ($1, $2, $3, $4, $5)", [userId, i.name.trim(), email, i.phone.trim() || null, i.country || null]);
}

export async function invitationStats(d: Db, userId: number) {
  const list = await d.q<{ id: number; name: string; email: string; phone: string | null; status: string; created_at: string; active: boolean | null; inactive90: boolean | null }>(
    `SELECT i.id, i.name, i.email, i.phone, i.status, to_char(i.created_at, 'YYYY-MM-DD') AS created_at,
            u.plan_until >= CURRENT_DATE AS active, u.last_seen_at < now() - interval '90 days' AS inactive90
     FROM invitations i LEFT JOIN users u ON lower(u.email) = lower(i.email) WHERE i.user_id = $1 ORDER BY i.created_at DESC`,
    [userId],
  );
  return list;
}

export async function addLicense(d: Db, ownerId: number, l: { name: string; email: string; phone: string }) {
  if (!l.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(l.email.trim())) throw new Error("Please enter the name and a valid email");
  const [o] = await d.q<{ plan: string; email: string }>("SELECT plan, email FROM users WHERE id = $1", [ownerId]);
  const seats = isGroupPlan(o.plan) ? PLANS[o.plan as "group_monthly" | "group_yearly"].seats : 0;
  if (!seats) throw new Error("Group License needs a Group package. Buy Group Per Month or Group Per Year in My Account → Invoices.");
  const [{ n }] = await d.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM group_licenses WHERE owner_id = $1", [ownerId]);
  if (n >= seats) throw new Error(`Limit Exceeded. You can add only ${seats} persons in your group license`);
  const email = l.email.trim().toLowerCase();
  if (email === o.email) throw new Error("You are already covered as the payer of this group.");
  const [dup] = await d.q("SELECT 1 FROM group_licenses WHERE owner_id = $1 AND email = $2", [ownerId, email]);
  if (dup) throw new Error("This email is already in your group license");
  await d.q("INSERT INTO group_licenses (owner_id, name, email, phone) VALUES ($1, $2, $3, $4)", [ownerId, l.name.trim(), l.email.trim().toLowerCase(), l.phone.trim() || null]);
}
export async function licenses(d: Db, ownerId: number) {
  return d.q<{ id: number; name: string; email: string; phone: string | null; created_at: string; used: boolean }>(
    `SELECT g.id, g.name, g.email, g.phone, to_char(g.created_at, 'YYYY-MM-DD') AS created_at, EXISTS (SELECT 1 FROM users u WHERE u.email = g.email) AS used
     FROM group_licenses g WHERE g.owner_id = $1 ORDER BY g.created_at DESC`,
    [ownerId],
  );
}
export async function deleteLicense(d: Db, ownerId: number, id: number) {
  await d.q("DELETE FROM group_licenses WHERE id = $1 AND owner_id = $2", [id, ownerId]);
}

export async function reportIssue(d: Db, userId: number, message: string) {
  if (message.trim().length < 5) throw new Error("Please enter your issue here.");
  await d.q("INSERT INTO issues (user_id, message) VALUES ($1, $2)", [userId, message.trim().slice(0, 4000)]);
}
