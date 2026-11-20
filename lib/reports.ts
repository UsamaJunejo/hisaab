import type { Db } from "./db.ts";
import { accountBalances, sharedWithMe, type Nature, type Range } from "./books.ts";

// ---------------------------------------------------------------- Group Ledger

export type GLRow = { account_id: number; name: string; sub: string; category: string; receipts: number; payments: number; balance: number; first: string | null; last: string | null; share_id: number | null; person: string | null };
export type GLTab = "my" | "shared-my" | "shared-others";
export const SORTS: [string, string][] = [
  ["az", "Account Title (A - Z)"], ["za", "Account Title (Z - A)"], ["low", "Lowest Balance"], ["high", "Highest Balance"], ["last", "Last Entry"], ["first", "First Entry"],
];

/** RECEIPTS = money into the account, PAYMENTS = money out (the same meaning as the account ledger). */
export async function groupLedger(d: Db, viewer: number, tab: GLTab, sort = "az"): Promise<GLRow[]> {
  const sums = `COALESCE(SUM(e.amount) FILTER (WHERE e.to_account_id = a.id), 0)::float8 AS receipts,
                COALESCE(SUM(e.amount) FILTER (WHERE e.from_account_id = a.id), 0)::float8 AS payments,
                to_char(MIN(e.date), 'YYYY-MM-DD') AS first, to_char(MAX(e.date), 'YYYY-MM-DD') AS last`;
  const join = `LEFT JOIN entries e ON (e.to_account_id = a.id OR e.from_account_id = a.id) AND e.deleted_at IS NULL AND (e.status = 3 OR e.user_id = $1)`;
  let rows: Omit<GLRow, "balance">[];
  if (tab === "my") {
    rows = await d.q(
      `SELECT a.id AS account_id, a.name, s.name AS sub, c.name AS category, ${sums}, NULL::int AS share_id, NULL AS person
       FROM accounts a JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id ${join}
       WHERE a.user_id = $1 GROUP BY a.id, s.id, c.id`,
      [viewer],
    );
  } else if (tab === "shared-my") {
    rows = await d.q(
      `SELECT a.id AS account_id, a.name, s.name AS sub, c.name AS category, ${sums}, sh.id AS share_id,
              u.name || CASE WHEN sh.status = 'pending' THEN ' (waiting to accept)' ELSE '' END AS person
       FROM shares sh JOIN accounts a ON a.id = sh.account_id JOIN users u ON u.id = sh.shared_with
       JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id ${join}
       WHERE sh.owner_id = $1 GROUP BY a.id, s.id, c.id, sh.id, u.id`,
      [viewer],
    );
  } else {
    rows = await d.q(
      `SELECT a.id AS account_id, a.name, s.name AS sub, c.name AS category, ${sums}, sh.id AS share_id, u.name AS person
       FROM shares sh JOIN accounts a ON a.id = sh.account_id JOIN users u ON u.id = sh.owner_id
       JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id ${join}
       WHERE sh.shared_with = $1 AND sh.status = 'active' GROUP BY a.id, s.id, c.id, sh.id, u.id`,
      [viewer],
    );
  }
  const out = rows.map((r) => ({ ...r, balance: r.receipts - r.payments }));
  const by: Record<string, (a: GLRow, b: GLRow) => number> = {
    az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name),
    low: (a, b) => a.balance - b.balance, high: (a, b) => b.balance - a.balance,
    last: (a, b) => (b.last ?? "").localeCompare(a.last ?? ""), first: (a, b) => (a.first ?? "9").localeCompare(b.first ?? "9"),
  };
  return out.sort(by[sort] ?? by.az);
}

// ---------------------------------------------------------------- the account tree (statements)

export type TreeAcc = { id: number; name: string; balance: number };
export type TreeSub = { id: number; name: string; balance: number; accounts: TreeAcc[] };
export type TreeCat = { id: number; name: string; nature: Nature | "Shared"; balance: number; subs: TreeSub[] };

/** Category -> sub-category -> account, each with its balance for the range; plus CROSS SHARED (accounts shared with you, by owner). */
export async function tree(d: Db, viewer: number, r: Range): Promise<TreeCat[]> {
  const accs = await accountBalances(d, viewer, r);
  const cats = await d.q<{ id: number; name: string; nature: Nature }>("SELECT id, name, nature FROM categories WHERE user_id = $1 ORDER BY kind <> 'normal', sort, id", [viewer]);
  const subs = await d.q<{ id: number; name: string; category_id: number }>("SELECT id, name, category_id FROM subcategories WHERE user_id = $1 ORDER BY name", [viewer]);
  const out: TreeCat[] = cats.map((c): TreeCat => {
    const ss = subs.filter((s) => s.category_id === c.id).map((s) => {
      const aa = accs.filter((a) => a.subcategory_id === s.id).map((a) => ({ id: a.id, name: a.name, balance: a.balance }));
      return { id: s.id, name: s.name, accounts: aa, balance: aa.reduce((t, a) => t + a.balance, 0) };
    });
    const withAccounts = ss.filter((s) => s.accounts.length > 0); // like MunshiBaba, empty branches are left out
    return { id: c.id, name: c.name, nature: c.nature, subs: withAccounts, balance: withAccounts.reduce((t, s) => t + s.balance, 0) };
  }).filter((c) => c.subs.length > 0);
  const shared = await sharedWithMe(d, viewer, r);
  if (shared.length) {
    const owners = [...new Map(shared.map((s) => [s.owner_id, s.owner])).entries()];
    const ss = owners.map(([oid, name]) => {
      const aa = shared.filter((s) => s.owner_id === oid).map((s) => ({ id: s.account_id, name: s.name, balance: s.balance }));
      return { id: -oid, name, accounts: aa, balance: aa.reduce((t, a) => t + a.balance, 0) };
    });
    out.push({ id: 0, name: "CROSS SHARED", nature: "Shared", subs: ss, balance: ss.reduce((t, s) => t + s.balance, 0) });
  }
  return out;
}

export const sumNature = (t: TreeCat[], ...n: (Nature | "Shared")[]) => t.filter((c) => n.includes(c.nature)).reduce((s, c) => s + c.balance, 0);

/** Net worth = Assets + Liabilities balances (liabilities you owe are negative), i.e. assets − liabilities. */
export const netWorth = (t: TreeCat[]) => sumNature(t, "Assets", "Liabilities");

/** Profit or loss = Expenses + Income balances. >= 0 means a loss (more spent than earned). */
export function profitLoss(t: TreeCat[]) {
  const v = sumNature(t, "Expenses", "Income");
  return { label: v >= 0 ? "NET LOSS" : "NET PROFIT", amount: Math.abs(v), raw: v };
}

// ---------------------------------------------------------------- currency ledger

export async function usedCurrencies(d: Db, viewer: number): Promise<string[]> {
  const r = await d.q<{ currency: string }>("SELECT DISTINCT currency FROM entries WHERE user_id = $1 AND currency IS NOT NULL AND deleted_at IS NULL ORDER BY currency", [viewer]);
  return r.map((x) => x.currency);
}

export async function currencyLedger(d: Db, viewer: number, currency: string, r: Range) {
  const rows = await d.q<{ id: number; date: string; note: string | null; from_name: string; to_name: string; amount: number; foreign_amount: number; rate: number; vtype: string }>(
    `SELECT e.id, to_char(e.date, 'YYYY-MM-DD') AS date, e.note, fa.name AS from_name, ta.name AS to_name, e.amount::float8 AS amount,
            e.foreign_amount::float8 AS foreign_amount, e.rate::float8 AS rate, e.vtype
     FROM entries e JOIN accounts fa ON fa.id = e.from_account_id JOIN accounts ta ON ta.id = e.to_account_id
     WHERE e.user_id = $1 AND e.currency = $2 AND e.deleted_at IS NULL AND e.date BETWEEN $3::date AND $4::date ORDER BY e.date, e.id`,
    [viewer, currency, r.from ?? "1900-01-01", r.to ?? "2999-12-31"],
  );
  const [o] = await d.q<{ base: number; foreign: number }>(
    `SELECT COALESCE(SUM(CASE WHEN vtype = 'R' THEN amount ELSE -amount END), 0)::float8 AS base,
            COALESCE(SUM(CASE WHEN vtype = 'R' THEN foreign_amount ELSE -foreign_amount END), 0)::float8 AS foreign
     FROM entries WHERE user_id = $1 AND currency = $2 AND deleted_at IS NULL AND date < $3::date`,
    [viewer, currency, r.from ?? "1900-01-01"],
  );
  return { rows, opening: o };
}

// ---------------------------------------------------------------- attachments & deleted log

export async function attachmentsByAccount(d: Db, viewer: number) {
  return d.q<{ account_id: number; name: string; files: number; bytes: number }>(
    `SELECT a.id AS account_id, a.name, COUNT(DISTINCT x.id)::int AS files, COALESCE(SUM(x.size), 0)::float8 AS bytes
     FROM attachments x JOIN entries e ON e.id = x.entry_id JOIN accounts a ON a.id IN (e.from_account_id, e.to_account_id)
     WHERE x.user_id = $1 AND a.user_id = $1 AND e.deleted_at IS NULL GROUP BY a.id ORDER BY a.name`,
    [viewer],
  );
}

export async function attachmentsOfAccount(d: Db, viewer: number, accountId: number) {
  return d.q<{ id: number; name: string; mime: string; size: number; entry_id: number; date: string; note: string | null; amount: number }>(
    `SELECT x.id, x.name, x.mime, x.size, e.id AS entry_id, to_char(e.date, 'YYYY-MM-DD') AS date, e.note, e.amount::float8 AS amount
     FROM attachments x JOIN entries e ON e.id = x.entry_id WHERE x.user_id = $1 AND $2 IN (e.from_account_id, e.to_account_id) AND e.deleted_at IS NULL ORDER BY e.date DESC, x.id`,
    [viewer, accountId],
  );
}

export async function deletedByAccount(d: Db, viewer: number) {
  return d.q<{ account_id: number; name: string; sub: string; category: string; receipts: number; payments: number; count: number; last: string }>(
    `SELECT a.id AS account_id, a.name, s.name AS sub, c.name AS category,
            COALESCE(SUM(e.amount) FILTER (WHERE e.to_account_id = a.id), 0)::float8 AS receipts,
            COALESCE(SUM(e.amount) FILTER (WHERE e.from_account_id = a.id), 0)::float8 AS payments,
            COUNT(*)::int AS count, MAX(e.deleted_at)::text AS last
     FROM entries e JOIN accounts a ON a.id IN (e.from_account_id, e.to_account_id) JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id
     WHERE e.user_id = $1 AND a.user_id = $1 AND e.deleted_at IS NOT NULL GROUP BY a.id, s.id, c.id ORDER BY a.name`,
    [viewer],
  );
}

export async function deletedOfAccount(d: Db, viewer: number, accountId: number) {
  return d.q<{ id: number; date: string; note: string | null; other: string; in: number; out: number; deleted_at: string }>(
    `SELECT e.id, to_char(e.date, 'YYYY-MM-DD') AS date, e.note, CASE WHEN e.to_account_id = $2 THEN fa.name ELSE ta.name END AS other,
            CASE WHEN e.to_account_id = $2 THEN e.amount ELSE 0 END::float8 AS in, CASE WHEN e.from_account_id = $2 THEN e.amount ELSE 0 END::float8 AS out,
            to_char(e.deleted_at, 'YYYY-MM-DD') AS deleted_at
     FROM entries e JOIN accounts fa ON fa.id = e.from_account_id JOIN accounts ta ON ta.id = e.to_account_id
     WHERE e.user_id = $1 AND $2 IN (e.from_account_id, e.to_account_id) AND e.deleted_at IS NOT NULL ORDER BY e.deleted_at DESC`,
    [viewer, accountId],
  );
}
