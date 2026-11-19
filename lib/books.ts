import type { Db } from "./db.ts";
import { addDays, today } from "./format.ts";

// ======================================================================================
// The rules (same as MunshiBaba):
// - Category (level 1, has a nature) -> Sub-category (level 2) -> Account (level 3).
// - An entry (voucher) moves an amount FROM one account TO another. vtype P/R only decides
//   whether it is listed as a payment or a receipt.
// - Account balance = money received (TO) - money sent (FROM). No flipping by nature, so the
//   balances of all of a person's accounts (plus accounts shared with them) add up to zero.
// - An entry made by someone else in your shared account counts for you only once you approve it.
// ======================================================================================

export type Nature = "Assets" | "Liabilities" | "Equity" | "Expenses" | "Income";
export const NATURES: Nature[] = ["Assets", "Liabilities", "Equity", "Expenses", "Income"];
export type Range = { from: string | null; to: string | null };
export const ALL: Range = { from: null, to: null };

type IdRow = { id: number };

// ---------------------------------------------------------------- users & default chart

const DEFAULTS: { name: string; nature: Nature; color: string; icon: string; kind?: "payables" | "receivables"; subs: [string, string, string, string[]][] }[] = [
  { name: "ASSETS", nature: "Assets", color: "#00A34F", icon: "building", subs: [["PROPERTY", "#00A34F", "home", ["HOUSE"]]] },
  { name: "BANK", nature: "Assets", color: "#026938", icon: "bank", subs: [["MY BANK", "#026938", "bank", ["BANK ACCOUNT"]]] },
  { name: "CASH", nature: "Assets", color: "#638AD7", icon: "cash", subs: [["CASH IN HAND", "#638AD7", "wallet", ["CASH"]]] },
  { name: "EQUITY", nature: "Equity", color: "#8B008B", icon: "dollar", subs: [["INVESTMENT", "#8B008B", "briefcase", ["CAPITAL"]]] },
  {
    name: "EXPENSE", nature: "Expenses", color: "#EE5222", icon: "bar-chart",
    subs: [
      ["HOUSE HOLD", "#EE5222", "household", ["GROCERY", "DAILY KITCHEN"]],
      ["UTILITY", "#F7941D", "utility", ["ELECTRICITY", "GAS", "INTERNET"]],
      ["FOOD", "#E42127", "food", ["EATING OUT"]],
      ["TRANSPORT", "#38459B", "car", ["FUEL"]],
      ["MEDICAL", "#EC196E", "medical", ["MEDICAL"]],
    ],
  },
  { name: "INCOME", nature: "Income", color: "#00A34F", icon: "line-chart", subs: [["SALARY", "#14B14B", "salary", ["SALARY"]], ["BUSINESS", "#1BAEAA", "shop", ["SALES"]]] },
  {
    name: "LIABILITIES", nature: "Liabilities", color: "#7F7F7F", icon: "liability",
    subs: [["BANK LOANS", "#7F7F7F", "bank", ["BANK LOAN"]], ["CREDIT CARDS", "#6353A2", "credit-card", ["CREDIT CARD"]], ["PRIVATE LOANS", "#944B43", "friend", []]],
  },
  { name: "PAYABLES", nature: "Liabilities", color: "#F6A523", icon: "payment", kind: "payables", subs: [] },
  { name: "RECEIVABLES", nature: "Assets", color: "#1E8955", icon: "receipt", kind: "receivables", subs: [] },
];

export async function seedDefaults(d: Db, userId: number) {
  for (const [i, c] of DEFAULTS.entries()) {
    const [cat] = await d.q<IdRow>(
      "INSERT INTO categories (user_id, name, nature, color, icon, kind, sort) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [userId, c.name, c.nature, c.color, c.icon, c.kind ?? "normal", i],
    );
    for (const [sub, color, icon, accs] of c.subs) {
      const [s] = await d.q<IdRow>("INSERT INTO subcategories (user_id, category_id, name, color, icon) VALUES ($1, $2, $3, $4, $5) RETURNING id", [userId, cat.id, sub, color, icon]);
      for (const a of accs) await d.q("INSERT INTO accounts (user_id, subcategory_id, name, color, icon) VALUES ($1, $2, $3, $4, $5)", [userId, s.id, a, color, icon]);
    }
  }
}

export type NewUser = { name: string; email: string; phone?: string | null; country?: string; passwordHash: string; plan?: "free" | "monthly" | "yearly"; referredBy?: number | null };

export async function createUser(d: Db, u: NewUser): Promise<number> {
  const name = u.name.trim();
  const email = u.email.trim().toLowerCase();
  if (!name) throw new Error("Please Enter Full Name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Please Enter Valid Email");
  const phone = (u.phone ?? "").replace(/[^\d+]/g, "");
  if (phone && phone.replace(/\D/g, "").length < 10) throw new Error("Please Enter Valid Email or Cell Number With At Least 10 (Ten) Digits.");
  const [dup] = await d.q("SELECT 1 FROM users WHERE email = $1 OR ($2 <> '' AND phone = $2)", [email, phone]);
  if (dup) throw new Error("You are already registered; please log in");
  return d.tx(async (t) => {
    const plan = u.plan ?? "free";
    const [row] = await t.q<IdRow>(
      `INSERT INTO users (customer_no, name, email, phone, country, password_hash, is_admin, plan, plan_until, data_mb, referred_by)
       VALUES (lpad((floor(random() * 9000000) + 1000000)::text, 7, '0'), $1, $2, $3, $4, $5, NOT EXISTS (SELECT 1 FROM users), $6,
               CURRENT_DATE + $7::int, $8, $9) RETURNING id`,
      [name, email, phone || null, u.country || "PK", u.passwordHash, plan, plan === "free" ? 14 : plan === "monthly" ? 30 : 365, plan === "free" ? 25 : 100, u.referredBy ?? null],
    );
    await seedDefaults(t, row.id);
    await t.q(
      `INSERT INTO invoices (user_id, number, package, amount_cents, due_at, status)
       VALUES ($1::int, 'HSB-' || to_char(now(), 'YYYY') || '-' || lpad($1::int::text, 7, '0') || '-' || floor(random() * 1000)::int, $2, $3, now() + ($4::int * interval '1 day'), $5)`,
      [row.id, plan === "free" ? "14 Days Free" : plan === "monthly" ? "Single Per Month" : "Single Per Year", plan === "free" ? 0 : plan === "monthly" ? 100 : 1000, plan === "free" ? 14 : 0, plan === "free" ? "FREE" : "UnPaid"],
    );
    return row.id;
  });
}

// ---------------------------------------------------------------- chart (categories / subs / accounts)

export type Category = { id: number; name: string; nature: Nature; color: string; icon: string; kind: "normal" | "payables" | "receivables"; balance: number; accounts: number };
export type Sub = { id: number; category_id: number; category: string; nature: Nature; name: string; color: string; icon: string; balance: number };
export type Account = { id: number; subcategory_id: number; sub: string; category_id: number; category: string; nature: Nature; name: string; color: string; icon: string; balance: number; user_id: number };

/** Entries that count for a viewer: approved ones, plus everything the viewer made themselves. */
const COUNTS = "e.deleted_at IS NULL AND (e.status = 3 OR e.user_id = $1)";
// Always present (wide defaults when not filtering) so every query has the same parameters.
const inRange = (_r: Range, from: number, to: number) => ` AND e.date >= $${from}::date AND e.date <= $${to}::date`;
const rangeParams = (r: Range) => [r.from ?? "1900-01-01", r.to ?? "2999-12-31"];

/** Balance of every account the viewer owns (in the range: movement within it). */
export async function accountBalances(d: Db, viewer: number, r: Range = ALL): Promise<Account[]> {
  return d.q<Account>(
    `SELECT a.id, a.user_id, a.name, a.color, a.icon, a.subcategory_id, s.name AS sub, c.id AS category_id, c.name AS category, c.nature,
            COALESCE(SUM(CASE WHEN e.id IS NULL THEN 0 WHEN e.to_account_id = a.id THEN e.amount ELSE -e.amount END), 0)::float8 AS balance
     FROM accounts a JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id
     LEFT JOIN entries e ON (e.to_account_id = a.id OR e.from_account_id = a.id) AND ${COUNTS}${inRange(r, 2, 3)}
     WHERE a.user_id = $1 GROUP BY a.id, s.id, c.id ORDER BY c.sort, c.id, s.name, a.name`,
    [viewer, ...rangeParams(r)],
  );
}

export async function categories(d: Db, viewer: number, r: Range = ALL): Promise<Category[]> {
  const accs = await accountBalances(d, viewer, r);
  const cats = await d.q<Omit<Category, "balance" | "accounts">>("SELECT id, name, nature, color, icon, kind FROM categories WHERE user_id = $1 ORDER BY kind <> 'normal', sort, id", [viewer]);
  return cats.map((c) => {
    const mine = accs.filter((a) => a.category_id === c.id);
    return { ...c, balance: mine.reduce((s, a) => s + a.balance, 0), accounts: mine.length };
  });
}

export async function subcategories(d: Db, viewer: number, r: Range = ALL, categoryId?: number): Promise<Sub[]> {
  const accs = await accountBalances(d, viewer, r);
  const subs = await d.q<Omit<Sub, "balance">>(
    `SELECT s.id, s.category_id, c.name AS category, c.nature, s.name, s.color, s.icon FROM subcategories s JOIN categories c ON c.id = s.category_id
     WHERE s.user_id = $1 ${categoryId ? "AND s.category_id = $2" : ""} ORDER BY ${categoryId ? "s.name" : "s.name, c.name"}`,
    categoryId ? [viewer, categoryId] : [viewer],
  );
  return subs.map((s) => ({ ...s, balance: accs.filter((a) => a.subcategory_id === s.id).reduce((t, a) => t + a.balance, 0) }));
}

async function own(d: Db, table: "categories" | "subcategories" | "accounts", id: number, userId: number) {
  const [r] = await d.q(`SELECT 1 FROM ${table} WHERE id = $1 AND user_id = $2`, [id, userId]);
  if (!r) throw new Error("Not found");
}

const COLOR = /^#[0-9a-fA-F]{6}$/;
function cleanLook(color: string, icon: string) {
  return { color: COLOR.test(color) ? color : "#000000", icon: /^[a-z0-9-]{1,40}$/.test(icon) ? icon : "plus-circle" };
}

export async function addCategory(d: Db, userId: number, f: { name: string; nature: Nature; color: string; icon: string }) {
  const name = f.name.trim();
  if (!name) throw new Error("Please Enter Category Name.");
  if (!NATURES.includes(f.nature)) throw new Error("Please Select Nature");
  const { color, icon } = cleanLook(f.color, f.icon);
  const [r] = await d.q<IdRow>(
    "INSERT INTO categories (user_id, name, nature, color, icon, sort) VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(sort), 0) + 1 FROM categories WHERE user_id = $1)) RETURNING id",
    [userId, name, f.nature, color, icon],
  );
  return r.id;
}

export async function updateCategory(d: Db, userId: number, id: number, f: { name: string; nature: Nature; color: string; icon: string }) {
  await own(d, "categories", id, userId);
  const [c] = await d.q<{ kind: string; name: string; nature: string }>("SELECT kind, name, nature FROM categories WHERE id = $1", [id]);
  const locked = c.kind !== "normal"; // PAYABLES / RECEIVABLES keep their name and nature
  const name = locked ? c.name : f.name.trim();
  if (!name) throw new Error("Please Enter Category Name.");
  const nature = locked ? c.nature : f.nature;
  if (!NATURES.includes(nature as Nature)) throw new Error("Please Select Nature");
  const { color, icon } = cleanLook(f.color, f.icon);
  await d.q("UPDATE categories SET name = $1, nature = $2, color = $3, icon = $4 WHERE id = $5", [name, nature, color, icon, id]);
}

export async function deleteCategory(d: Db, userId: number, id: number) {
  await own(d, "categories", id, userId);
  const [n] = await d.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM subcategories WHERE category_id = $1", [id]);
  if (n.n > 0) throw new Error("Category not deleted; please delete all sub categories first");
  await d.q("DELETE FROM categories WHERE id = $1", [id]);
}

export async function addSub(d: Db, userId: number, categoryId: number, f: { name: string; color: string; icon: string }) {
  await own(d, "categories", categoryId, userId);
  const name = f.name.trim();
  if (!name) throw new Error("Please Enter Sub-Category Name.");
  const { color, icon } = cleanLook(f.color, f.icon);
  const [r] = await d.q<IdRow>("INSERT INTO subcategories (user_id, category_id, name, color, icon) VALUES ($1, $2, $3, $4, $5) RETURNING id", [userId, categoryId, name, color, icon]);
  return r.id;
}

export async function updateSub(d: Db, userId: number, id: number, f: { name: string; color: string; icon: string }) {
  await own(d, "subcategories", id, userId);
  const name = f.name.trim();
  if (!name) throw new Error("Please Enter Sub-Category Name.");
  const { color, icon } = cleanLook(f.color, f.icon);
  await d.q("UPDATE subcategories SET name = $1, color = $2, icon = $3 WHERE id = $4", [name, color, icon, id]);
}

export async function deleteSub(d: Db, userId: number, id: number) {
  await own(d, "subcategories", id, userId);
  const [n] = await d.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM accounts WHERE subcategory_id = $1", [id]);
  if (n.n > 0) throw new Error("Sub Category not deleted; please delete all accounts first");
  await d.q("DELETE FROM subcategories WHERE id = $1", [id]);
}

export async function addAccount(d: Db, userId: number, subId: number, f: { name: string; color: string; icon: string }) {
  await own(d, "subcategories", subId, userId);
  const name = f.name.trim();
  if (!name) throw new Error("Please Enter Account Name.");
  const { color, icon } = cleanLook(f.color, f.icon);
  const [r] = await d.q<IdRow>("INSERT INTO accounts (user_id, subcategory_id, name, color, icon) VALUES ($1, $2, $3, $4, $5) RETURNING id", [userId, subId, name, color, icon]);
  return r.id;
}

export async function updateAccount(d: Db, userId: number, id: number, f: { name: string; color: string; icon: string }) {
  await own(d, "accounts", id, userId);
  const name = f.name.trim();
  if (!name) throw new Error("Please Enter Account Name.");
  const { color, icon } = cleanLook(f.color, f.icon);
  await d.q("UPDATE accounts SET name = $1, color = $2, icon = $3 WHERE id = $4", [name, color, icon, id]);
}

export async function deleteAccount(d: Db, userId: number, id: number) {
  await own(d, "accounts", id, userId);
  const [n] = await d.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM entries WHERE (from_account_id = $1 OR to_account_id = $1) AND deleted_at IS NULL", [id]);
  if (n.n > 0) throw new Error("Account not deleted; please delete all transactions first");
  await d.tx(async (t) => {
    await t.q("DELETE FROM attachments WHERE entry_id IN (SELECT id FROM entries WHERE from_account_id = $1 OR to_account_id = $1)", [id]);
    await t.q("DELETE FROM entries WHERE from_account_id = $1 OR to_account_id = $1", [id]);
    await t.q("DELETE FROM shares WHERE account_id = $1", [id]);
    await t.q("DELETE FROM accounts WHERE id = $1", [id]);
  });
}

/** Move an account (with all its entries) under another sub-category. */
export async function moveAccount(d: Db, userId: number, accountId: number, subId: number) {
  if (!accountId || !subId) throw new Error("Please select account and subcategory to move");
  await own(d, "accounts", accountId, userId);
  await own(d, "subcategories", subId, userId);
  await d.q("UPDATE accounts SET subcategory_id = $1 WHERE id = $2", [subId, accountId]);
}

export async function getCategory(d: Db, userId: number, id: number) {
  const [c] = await d.q<{ id: number; name: string; nature: Nature; color: string; icon: string; kind: string }>("SELECT id, name, nature, color, icon, kind FROM categories WHERE id = $1 AND user_id = $2", [id, userId]);
  return c;
}

export async function getSub(d: Db, userId: number, id: number) {
  const [s] = await d.q<{ id: number; name: string; color: string; icon: string; category_id: number; category: string }>(
    "SELECT s.id, s.name, s.color, s.icon, s.category_id, c.name AS category FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE s.id = $1 AND s.user_id = $2",
    [id, userId],
  );
  return s;
}

// ---------------------------------------------------------------- access

/** An account the viewer may see: their own, or one shared with them (active). */
export type Access = { account_id: number; owner_id: number; owner: string; name: string; mine: boolean; write: boolean; transfer: boolean; category: string; sub: string; color: string; icon: string };

export async function access(d: Db, viewer: number, accountId: number): Promise<Access | null> {
  const [a] = await d.q<Access>(
    `SELECT a.id AS account_id, a.user_id AS owner_id, u.name AS owner, a.name, a.user_id = $1 AS mine,
            (a.user_id = $1 OR sh.permission = 'write') AS write, COALESCE(sh.transfer_enabled, false) AS transfer,
            c.name AS category, s.name AS sub, a.color, a.icon
     FROM accounts a JOIN users u ON u.id = a.user_id JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id
     LEFT JOIN shares sh ON sh.account_id = a.id AND sh.shared_with = $1 AND sh.status = 'active'
     WHERE a.id = $2 AND (a.user_id = $1 OR sh.id IS NOT NULL)`,
    [viewer, accountId],
  );
  return a ?? null;
}

/** Accounts shared with the viewer (active), with balances as the viewer sees them. */
export type SharedAccount = Access & { balance: number; owner_customer: string };
export async function sharedWithMe(d: Db, viewer: number, r: Range = ALL): Promise<SharedAccount[]> {
  return d.q<SharedAccount>(
    `SELECT a.id AS account_id, a.user_id AS owner_id, u.name AS owner, u.customer_no AS owner_customer, a.name, false AS mine,
            sh.permission = 'write' AS write, sh.transfer_enabled AS transfer, c.name AS category, s.name AS sub, a.color, a.icon,
            COALESCE(SUM(CASE WHEN e.id IS NULL THEN 0 WHEN e.to_account_id = a.id THEN e.amount ELSE -e.amount END), 0)::float8 AS balance
     FROM shares sh JOIN accounts a ON a.id = sh.account_id JOIN users u ON u.id = a.user_id
     JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id
     LEFT JOIN entries e ON (e.to_account_id = a.id OR e.from_account_id = a.id) AND ${COUNTS}${inRange(r, 2, 3)}
     WHERE sh.shared_with = $1 AND sh.status = 'active'
     GROUP BY a.id, u.id, sh.id, c.id, s.id ORDER BY u.name, a.name`,
    [viewer, ...rangeParams(r)],
  );
}

/** Every account the viewer can pick in a voucher: own ones, and shared Read & Write ones. */
export type PickAccount = { id: number; name: string; category: string; sub: string; balance: number; owner: string | null };
export async function voucherAccounts(d: Db, viewer: number): Promise<PickAccount[]> {
  const own = (await accountBalances(d, viewer)).map((a) => ({ id: a.id, name: a.name, category: a.category, sub: a.sub, balance: a.balance, owner: null }));
  const shared = (await sharedWithMe(d, viewer)).filter((s) => s.write).map((s) => ({ id: s.account_id, name: s.name, category: "SHARED", sub: s.owner, balance: s.balance, owner: s.owner }));
  return [...own, ...shared];
}

// ---------------------------------------------------------------- entries

export type EntryInput = {
  vtype: "P" | "R";
  date: string;
  amount: number; // paisa, main currency
  fromId: number;
  toId: number;
  note?: string | null;
  highlight?: string | null;
  currency?: string | null; // foreign currency code when used
  foreignAmount?: number | null; // cents of that currency
  rate?: number | null;
};

async function checkEntry(d: Db, viewer: number, e: EntryInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || Number.isNaN(Date.parse(e.date))) throw new Error("Please Enter Date");
  if (!e.fromId || !e.toId || !Number.isSafeInteger(e.amount) || !(e.amount > 0)) throw new Error("Invalid input. Transaction Failed.");
  if (e.fromId === e.toId) throw new Error("From and To are the same account. Please choose two different accounts.");
  if (e.amount > 100_000_000_000) throw new Error("That amount is too large. Please check for an extra zero.");
  if ((e.note ?? "").length > 1000) throw new Error("The note is too long (1,000 letters max).");
  const a = await access(d, viewer, e.fromId);
  const b = await access(d, viewer, e.toId);
  if (!a || !b) throw new Error("Account not found");
  if (!a.write || !b.write) throw new Error("This shared account is Read only");
  return [a, b] as const;
}

async function logStatus(d: Db, entryId: number, status: number, by: number, description: string) {
  await d.q("INSERT INTO entry_status_log (entry_id, status, by_user, description) VALUES ($1, $2, $3, $4)", [entryId, status, by, description]);
}

async function notifyOwners(d: Db, viewer: number, entryId: number, owners: number[], text: string) {
  for (const o of new Set(owners)) if (o !== viewer) await d.q("INSERT INTO notifications (user_id, kind, ref_id, text) VALUES ($1, 'transaction', $2, $3)", [o, entryId, text]);
}

export async function addEntry(d: Db, viewer: number, e: EntryInput, files: { name: string; mime: string; data: Buffer }[] = []): Promise<number> {
  const [a, b] = await checkEntry(d, viewer, e);
  const foreignOwners = [a, b].filter((x) => !x.mine).map((x) => x.owner_id);
  if (files.length > 5) throw new Error("Maximum Five (05) Attachments Allowed.");
  return d.tx(async (t) => {
    const status = foreignOwners.length ? 0 : 3;
    const [r] = await t.q<IdRow>(
      `INSERT INTO entries (user_id, vtype, date, amount, from_account_id, to_account_id, note, highlight, currency, foreign_amount, rate, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [viewer, e.vtype, e.date, e.amount, e.fromId, e.toId, e.note?.trim() || null, e.highlight || null, e.currency || null, e.currency ? e.foreignAmount : null, e.currency ? e.rate : null, status],
    );
    for (const f of files) await t.q("INSERT INTO attachments (user_id, entry_id, name, mime, size, data) VALUES ($1, $2, $3, $4, $5, $6)", [viewer, r.id, f.name, f.mime, f.data.length, f.data]);
    if (status === 0) {
      await logStatus(t, r.id, 0, viewer, "Sent for approval");
      await notifyOwners(t, viewer, r.id, foreignOwners, "New transaction in your shared account");
    }
    return r.id;
  });
}

export async function updateEntry(d: Db, viewer: number, id: number, e: EntryInput, files: { name: string; mime: string; data: Buffer }[] = [], removeFiles: number[] = []) {
  const [cur] = await d.q<{ user_id: number }>("SELECT user_id FROM entries WHERE id = $1 AND deleted_at IS NULL", [id]);
  if (!cur || cur.user_id !== viewer) throw new Error("Only the person who made this entry can change it");
  const [a, b] = await checkEntry(d, viewer, e);
  const foreignOwners = [a, b].filter((x) => !x.mine).map((x) => x.owner_id);
  await d.tx(async (t) => {
    const [{ n }] = await t.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM attachments WHERE entry_id = $1 AND NOT (id = ANY($2::int[]))", [id, removeFiles]);
    if (n + files.length > 5) throw new Error("Maximum Five (05) Attachments Allowed.");
    const status = foreignOwners.length ? 0 : 3;
    await t.q(
      `UPDATE entries SET vtype = $1, date = $2, amount = $3, from_account_id = $4, to_account_id = $5, note = $6, highlight = $7,
              currency = $8, foreign_amount = $9, rate = $10, status = $11, updated_at = now() WHERE id = $12`,
      [e.vtype, e.date, e.amount, e.fromId, e.toId, e.note?.trim() || null, e.highlight || null, e.currency || null, e.currency ? e.foreignAmount : null, e.currency ? e.rate : null, status, id],
    );
    if (removeFiles.length) await t.q("DELETE FROM attachments WHERE entry_id = $1 AND id = ANY($2::int[])", [id, removeFiles]);
    for (const f of files) await t.q("INSERT INTO attachments (user_id, entry_id, name, mime, size, data) VALUES ($1, $2, $3, $4, $5, $6)", [viewer, id, f.name, f.mime, f.data.length, f.data]);
    if (status === 0) {
      await logStatus(t, id, 0, viewer, "Changed and sent again (Resend)");
      await notifyOwners(t, viewer, id, foreignOwners, "A transaction in your shared account was changed");
    }
  });
}

export async function deleteEntry(d: Db, viewer: number, id: number) {
  const r = await d.q("UPDATE entries SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id", [id, viewer]);
  if (!r.length) throw new Error("Only the person who made this entry can delete it");
}

/** Bring back a deleted entry (MunshiBaba has no restore; we add it). */
export async function restoreEntry(d: Db, viewer: number, id: number) {
  const r = await d.q("UPDATE entries SET deleted_at = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL RETURNING id", [id, viewer]);
  if (!r.length) throw new Error("Not found");
}

export type Entry = {
  id: number; user_id: number; maker: string; vtype: "P" | "R"; date: string; amount: number; from_account_id: number; to_account_id: number;
  from_name: string; to_name: string; note: string | null; highlight: string | null; currency: string | null; foreign_amount: number | null;
  rate: number | null; status: number; transferred: boolean; attachments: number; created_at: string; deleted_at: string | null;
};

export const ENTRY_FIELDS = `SELECT e.id, e.user_id, mu.name AS maker, e.vtype, to_char(e.date, 'YYYY-MM-DD') AS date, e.amount::float8 AS amount,
  e.from_account_id, e.to_account_id, fa.name AS from_name, ta.name AS to_name, e.note, e.highlight, e.currency,
  e.foreign_amount::float8 AS foreign_amount, e.rate::float8 AS rate, e.status, e.transferred,
  (SELECT COUNT(*)::int FROM attachments x WHERE x.entry_id = e.id) AS attachments,
  e.created_at::text AS created_at, e.deleted_at::text AS deleted_at`;
export const ENTRY_FROM = `FROM entries e JOIN accounts fa ON fa.id = e.from_account_id JOIN accounts ta ON ta.id = e.to_account_id JOIN users mu ON mu.id = e.user_id`;
export const ENTRY_SELECT = `${ENTRY_FIELDS} ${ENTRY_FROM}`;

/** An entry the viewer can see (made it, or it touches an account they own or that is shared with them). */
export async function getEntry(d: Db, viewer: number, id: number): Promise<Entry | undefined> {
  const [e] = await d.q<Entry>(`${ENTRY_SELECT} WHERE e.id = $1`, [id]);
  if (!e) return undefined;
  if (e.user_id === viewer) return e;
  if ((await access(d, viewer, e.from_account_id)) || (await access(d, viewer, e.to_account_id))) return e;
  return undefined;
}

/** Vouchers of one type the viewer made, newest first (voucher page history, Payment/Receipt history). */
export async function vouchers(d: Db, viewer: number, vtype: "P" | "R", r: Range): Promise<Entry[]> {
  return d.q<Entry>(`${ENTRY_SELECT} WHERE e.user_id = $1 AND e.vtype = $2 AND e.deleted_at IS NULL${inRange(r, 3, 4)} ORDER BY e.date DESC, e.id DESC`, [viewer, vtype, ...rangeParams(r)]);
}

// ---------------------------------------------------------------- ledger (Account Activity)

export type LedgerRow = Entry & { in: number; out: number; running: number | null; other: string; direction: "from" | "to"; mine: boolean };
export type Ledger = { opening: number; rows: LedgerRow[]; pending: LedgerRow[]; totalIn: number; totalOut: number; closing: number; balance: number; total: number };

export async function ledger(d: Db, viewer: number, accountId: number, r: Range, page = 1, size = 25): Promise<Ledger> {
  const acc = await access(d, viewer, accountId);
  if (!acc) throw new Error("Account not found");
  const [{ opening }] = await d.q<{ opening: number }>(
    `SELECT COALESCE(SUM(CASE WHEN e.to_account_id = $2 THEN e.amount ELSE -e.amount END), 0)::float8 AS opening
     FROM entries e WHERE (e.to_account_id = $2 OR e.from_account_id = $2) AND ${COUNTS} AND e.date < $3::date`,
    [viewer, accountId, r.from ?? "1900-01-01"],
  );
  const [{ balance }] = await d.q<{ balance: number }>(
    `SELECT COALESCE(SUM(CASE WHEN e.to_account_id = $2 THEN e.amount ELSE -e.amount END), 0)::float8 AS balance
     FROM entries e WHERE (e.to_account_id = $2 OR e.from_account_id = $2) AND ${COUNTS}`,
    [viewer, accountId],
  );
  const all = await d.q<Entry>(
    `${ENTRY_SELECT} WHERE (e.to_account_id = $1 OR e.from_account_id = $1) AND e.deleted_at IS NULL${inRange(r, 2, 3)}
     ORDER BY e.date, e.id`,
    [accountId, ...rangeParams(r)],
  );
  const shape = (e: Entry): Omit<LedgerRow, "running"> => {
    const isIn = e.to_account_id === accountId;
    return { ...e, in: isIn ? e.amount : 0, out: isIn ? 0 : e.amount, other: isIn ? e.from_name : e.to_name, direction: isIn ? "from" : "to", mine: e.user_id === viewer };
  };
  let run = opening, tin = 0, tout = 0;
  const rows: LedgerRow[] = [];
  const pending: LedgerRow[] = [];
  for (const e of all) {
    const s = shape(e);
    if (e.status === 3 || e.user_id === viewer) {
      run += s.in - s.out; tin += s.in; tout += s.out;
      rows.push({ ...s, running: run });
    } else if (e.status !== 2) pending.push({ ...s, running: null });
  }
  const shown = rows.slice(0, page * size);
  return { opening, rows: shown, pending, totalIn: tin, totalOut: tout, closing: run, balance, total: rows.length };
}

// ---------------------------------------------------------------- date filter

export type FilterKey = "all" | "today" | "month" | "30" | "4m" | "6m" | "12m" | "custom";
export const FILTERS: [FilterKey, string][] = [
  ["all", "ALL TIME"], ["today", "TODAY"], ["month", "THIS MONTH"], ["30", "LAST 30 DAYS"], ["4m", "LAST 4 MONTHS"], ["6m", "LAST 6 MONTHS"], ["12m", "LAST 12 MONTHS"],
];

export function rangeFor(key: FilterKey, custom?: { from?: string; to?: string }, now = today()): Range {
  const [y, m] = now.split("-");
  const back = (months: number) => {
    const dt = new Date(now + "T00:00:00Z"); dt.setUTCMonth(dt.getUTCMonth() - months); return dt.toISOString().slice(0, 10);
  };
  switch (key) {
    case "today": return { from: now, to: now };
    case "month": return { from: `${y}-${m}-01`, to: now };
    case "30": return { from: addDays(now, -29), to: now };
    case "4m": return { from: back(4), to: now };
    case "6m": return { from: back(6), to: now };
    case "12m": return { from: back(12), to: now };
    case "custom": return { from: custom?.from || null, to: custom?.to || null };
    default: return ALL;
  }
}

/** First and last entry dates (dashboard "dd-mm-yyyy to dd-mm-yyyy" under ALL TIME). */
export async function entryDates(d: Db, viewer: number): Promise<[string, string]> {
  const [r] = await d.q<{ a: string | null; b: string | null }>(
    `SELECT to_char(MIN(e.date), 'YYYY-MM-DD') AS a, to_char(MAX(e.date), 'YYYY-MM-DD') AS b FROM entries e
     JOIN accounts fa ON fa.id = e.from_account_id JOIN accounts ta ON ta.id = e.to_account_id
     WHERE e.deleted_at IS NULL AND (fa.user_id = $1 OR ta.user_id = $1 OR e.user_id = $1)`,
    [viewer],
  );
  return [r.a ?? today(), today()];
}

/** PAYMENTS / RECEIPTS / SHARED totals for the dashboard's bottom row. */
export async function dashboardTotals(d: Db, viewer: number, r: Range) {
  const [t] = await d.q<{ p: number; rc: number }>(
    `SELECT COALESCE(SUM(amount) FILTER (WHERE vtype = 'P'), 0)::float8 AS p, COALESCE(SUM(amount) FILTER (WHERE vtype = 'R'), 0)::float8 AS rc
     FROM entries e WHERE e.user_id = $1 AND e.deleted_at IS NULL${inRange(r, 2, 3)}`,
    [viewer, ...rangeParams(r)],
  );
  const shared = (await sharedWithMe(d, viewer, r)).reduce((s, a) => s + a.balance, 0);
  return { payments: t.p, receipts: t.rc, shared };
}
