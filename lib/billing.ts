import type { Db } from "./db.ts";

// Plans (same as MunshiBaba): Free 14 days / 25 MB, Personal USD 1 a month / 100 MB, USD 10 a year.
// There is no card gateway here: money comes in as "Funds" (a request an admin confirms, e.g. after a
// JazzCash or bank transfer), and invoices are paid from Funds.

export const PLANS = { monthly: { name: "Single Per Month", cents: 100, days: 30, mb: 100 }, yearly: { name: "Single Per Year", cents: 1000, days: 365, mb: 100 } } as const;
export const METHODS = ["JazzCash", "Easypaisa", "Bank Transfer", "Credit / Debit Card"];

export type Invoice = { id: number; number: string; package: string; amount_cents: number; created_at: string; due_at: string; status: string; paid_at: string | null };

export async function invoices(d: Db, userId: number): Promise<Invoice[]> {
  return d.q<Invoice>(
    `SELECT id, number, package, amount_cents, created_at::text AS created_at, due_at::text AS due_at, status, paid_at::text AS paid_at
     FROM invoices WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
}

/** Funds balance in US cents: confirmed additions + referral earnings - invoice payments - transfers out. */
export async function fundsBalance(d: Db, userId: number): Promise<number> {
  const [r] = await d.q<{ b: number }>(
    `SELECT COALESCE(SUM(CASE WHEN kind IN ('add', 'referral') AND status = 'Completed' THEN amount_cents
                          WHEN kind IN ('invoice', 'transfer') AND status = 'Completed' THEN -amount_cents ELSE 0 END), 0)::int AS b
     FROM funds WHERE user_id = $1`,
    [userId],
  );
  return r.b;
}

export async function fundsHistory(d: Db, userId: number) {
  return d.q<{ id: number; kind: string; amount_cents: number; method: string | null; remarks: string | null; payment_to: string | null; status: string; created_at: string }>(
    "SELECT id, kind, amount_cents, method, remarks, payment_to, status, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at FROM funds WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
}

/** Ask to add funds (an admin confirms it once the money arrives). */
export async function requestFunds(d: Db, userId: number, cents: number, method: string, remarks: string) {
  if (!(cents >= 100)) throw new Error("Please enter at least USD 1");
  if (!METHODS.includes(method)) throw new Error("Select Payment Method");
  await d.q("INSERT INTO funds (user_id, kind, amount_cents, method, remarks, status) VALUES ($1, 'add', $2, $3, $4, 'Pending')", [userId, cents, method, remarks.trim() || null]);
}

/** Send funds to another user (by customer number or email). */
export async function transferFunds(d: Db, userId: number, cents: number, to: string, remarks: string) {
  if (!(cents > 0)) throw new Error("Please enter the amount");
  const [r] = await d.q<{ id: number; name: string }>("SELECT id, name FROM users WHERE (customer_no = $1 OR email = lower($1)) AND id <> $2", [to.trim(), userId]);
  if (!r) throw new Error("No user found with that customer number or email");
  await d.tx(async (t) => {
    if ((await fundsBalance(t, userId)) < cents) throw new Error("Not enough funds");
    await t.q("INSERT INTO funds (user_id, kind, amount_cents, remarks, payment_to, status) VALUES ($1, 'transfer', $2, $3, $4, 'Completed')", [userId, cents, remarks.trim() || null, r.name]);
    await t.q("INSERT INTO funds (user_id, kind, amount_cents, remarks, status) VALUES ($1, 'add', $2, $3, 'Completed')", [r.id, cents, `Transfer received`]);
  });
}

/** Make an invoice for a plan (if there isn't an unpaid one already). */
export async function invoiceFor(d: Db, userId: number, plan: keyof typeof PLANS) {
  const p = PLANS[plan];
  const [open] = await d.q<{ id: number }>("SELECT id FROM invoices WHERE user_id = $1 AND status = 'UnPaid' AND package = $2", [userId, p.name]);
  if (open) return open.id;
  const [r] = await d.q<{ id: number }>(
    `INSERT INTO invoices (user_id, number, package, amount_cents, due_at, status)
     VALUES ($1::int, 'HSB-' || to_char(now(), 'YYYY') || '-' || lpad($1::int::text, 7, '0') || '-' || floor(random() * 100000)::int, $2, $3, now(), 'UnPaid') RETURNING id`,
    [userId, p.name, p.cents],
  );
  return r.id;
}

/** Pay an invoice from Funds: the plan is extended, and whoever invited this user earns 20%. */
export async function payInvoice(d: Db, userId: number, invoiceId: number) {
  await d.tx(async (t) => {
    const [inv] = await t.q<Invoice>("SELECT * FROM invoices WHERE id = $1 AND user_id = $2 AND status = 'UnPaid' FOR UPDATE", [invoiceId, userId]);
    if (!inv) throw new Error("Invoice not found or already paid");
    if ((await fundsBalance(t, userId)) < inv.amount_cents) throw new Error("Not enough funds. Please add funds first.");
    const plan = Object.values(PLANS).find((p) => p.name === inv.package) ?? PLANS.monthly;
    await t.q("INSERT INTO funds (user_id, kind, amount_cents, remarks, payment_to, status) VALUES ($1, 'invoice', $2, $3, 'Hisaab', 'Completed')", [userId, inv.amount_cents, `Invoice ${inv.number}`]);
    await t.q("UPDATE invoices SET status = 'Paid', paid_at = now() WHERE id = $1", [invoiceId]);
    await t.q(
      `UPDATE users SET plan = $1, data_mb = GREATEST(data_mb, $2), plan_until = GREATEST(plan_until, CURRENT_DATE) + $3::int WHERE id = $4`,
      [plan.days >= 365 ? "yearly" : "monthly", plan.mb, plan.days, userId],
    );
    const [u] = await t.q<{ referred_by: number | null }>("SELECT referred_by FROM users WHERE id = $1", [userId]);
    if (u.referred_by) {
      await t.q("INSERT INTO funds (user_id, kind, amount_cents, remarks, status) VALUES ($1, 'referral', $2, 'Referral reward (20%)', 'Completed')", [u.referred_by, Math.round(inv.amount_cents * 0.2)]);
    }
  });
}

// ---------------------------------------------------------------- admin (CEO dashboard)

export async function ceoStats(d: Db) {
  const [s] = await d.q<Record<string, number>>(
    `SELECT (SELECT COUNT(*) FROM users)::int AS registered,
            (SELECT COUNT(*) FROM users WHERE plan_until >= CURRENT_DATE)::int AS active,
            (SELECT COUNT(*) FROM users WHERE last_seen_at < now() - interval '90 days')::int AS inactive90,
            (SELECT COUNT(*) FROM invitations)::int AS invited,
            (SELECT COUNT(*) FROM invitations WHERE status = 'accepted')::int AS accepted,
            (SELECT COUNT(*) FROM invitations WHERE status = 'pending')::int AS pending,
            (SELECT COALESCE(SUM(amount_cents), 0) FROM invoices WHERE status = 'Paid')::int AS paid_cents,
            (SELECT COUNT(*) FROM entries WHERE deleted_at IS NULL)::int AS entries,
            (SELECT COUNT(*) FROM entries WHERE deleted_at IS NULL AND vtype = 'P')::int AS payments,
            (SELECT COUNT(*) FROM entries WHERE deleted_at IS NULL AND vtype = 'R')::int AS receipts,
            (SELECT COUNT(*) FROM attachments)::int AS attachments,
            (SELECT COALESCE(SUM(size), 0) FROM attachments)::float8 AS attachment_bytes,
            (SELECT COUNT(*) FROM users WHERE plan = 'free')::int AS free,
            (SELECT COUNT(*) FROM users WHERE plan = 'monthly')::int AS monthly,
            (SELECT COUNT(*) FROM users WHERE plan = 'yearly')::int AS yearly,
            (SELECT COUNT(*) FROM funds WHERE status = 'Pending')::int AS pending_funds,
            (SELECT COUNT(*) FROM issues)::int AS issues`,
  );
  return s;
}

export async function pendingFunds(d: Db) {
  return d.q<{ id: number; user: string; email: string; amount_cents: number; method: string | null; remarks: string | null; created_at: string }>(
    "SELECT f.id, u.name AS user, u.email, f.amount_cents, f.method, f.remarks, to_char(f.created_at, 'YYYY-MM-DD HH24:MI') AS created_at FROM funds f JOIN users u ON u.id = f.user_id WHERE f.kind = 'add' AND f.status = 'Pending' ORDER BY f.created_at",
  );
}

export async function decideFunds(d: Db, id: number, ok: boolean) {
  await d.q("UPDATE funds SET status = $1 WHERE id = $2 AND status = 'Pending'", [ok ? "Completed" : "Rejected", id]);
}
