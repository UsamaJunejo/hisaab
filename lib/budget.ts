import type { Db } from "./db.ts";
import { today } from "./format.ts";

export type Budget = { id: number; account_id: number; account: string; amount: number; start_date: string; end_date: string };

export async function budgets(d: Db, userId: number): Promise<Budget[]> {
  return d.q<Budget>(
    `SELECT b.id, b.account_id, a.name AS account, b.amount::float8 AS amount, to_char(b.start_date, 'YYYY-MM-DD') AS start_date, to_char(b.end_date, 'YYYY-MM-DD') AS end_date
     FROM budgets b JOIN accounts a ON a.id = b.account_id WHERE b.user_id = $1 ORDER BY b.start_date DESC, a.name`,
    [userId],
  );
}

/** Save a budget; budgets on one account may not overlap. */
export async function saveBudget(d: Db, userId: number, b: { id?: number; accountId: number; amount: number; from: string; to: string }) {
  if (!b.accountId || !(b.amount > 0) || !b.from || !b.to) throw new Error("Invalid input. Budget settings failed to save.");
  if (b.to < b.from) throw new Error("The To date can't be before the From date.");
  const [own] = await d.q("SELECT 1 FROM accounts WHERE id = $1 AND user_id = $2", [b.accountId, userId]);
  if (!own) throw new Error("Account not found");
  const [clash] = await d.q(
    "SELECT 1 FROM budgets WHERE account_id = $1 AND id <> $2 AND start_date <= $4::date AND end_date >= $3::date",
    [b.accountId, b.id ?? 0, b.from, b.to],
  );
  if (clash) throw new Error("You have already defined a budget within these dates for this account.");
  if (b.id) await d.q("UPDATE budgets SET account_id = $1, amount = $2, start_date = $3, end_date = $4 WHERE id = $5 AND user_id = $6", [b.accountId, b.amount, b.from, b.to, b.id, userId]);
  else await d.q("INSERT INTO budgets (user_id, account_id, amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5)", [userId, b.accountId, b.amount, b.from, b.to]);
}

export async function deleteBudget(d: Db, userId: number, id: number) {
  await d.q("DELETE FROM budgets WHERE id = $1 AND user_id = $2", [id, userId]);
}

/** Budget status of one account: total, spent (movement in the budget's dates), left. */
export async function budgetFor(d: Db, viewer: number, accountId: number, on = today()) {
  const all = await d.q<Budget & { spent: number }>(
    `SELECT b.id, b.account_id, '' AS account, b.amount::float8 AS amount, to_char(b.start_date, 'YYYY-MM-DD') AS start_date, to_char(b.end_date, 'YYYY-MM-DD') AS end_date,
            ABS(COALESCE((SELECT SUM(CASE WHEN e.to_account_id = b.account_id THEN e.amount ELSE -e.amount END) FROM entries e
              WHERE (e.to_account_id = b.account_id OR e.from_account_id = b.account_id) AND e.deleted_at IS NULL AND (e.status = 3 OR e.user_id = $1)
              AND e.date BETWEEN b.start_date AND b.end_date), 0))::float8 AS spent
     FROM budgets b WHERE b.account_id = $2 ORDER BY b.start_date DESC`,
    [viewer, accountId],
  );
  return { current: all.find((b) => b.start_date <= on && b.end_date >= on) ?? null, history: all };
}
