import type { Db } from "./db.ts";
import { addEntry, access, ENTRY_FIELDS, ENTRY_FROM, ENTRY_SELECT, type Entry } from "./books.ts";

// Sharing works like MunshiBaba:
// 1. The owner picks a person, then accounts, each with Read only / Read & Write and "Transfer Enable".
// 2. The other person gets a notification and must accept (MunshiBaba does this by email).
// 3. On a Read & Write account they can add entries; each needs the owner's approval to count for the owner.
// 4. With Transfer Enable, they can copy an approved entry into one of their own accounts, once.

export type SearchUser = { id: number; name: string; email: string | null; phone: string | null; customer_no: string };

/** Find people to share with (min 4 characters; matches name, email or cell they allow to be searched). */
export async function searchUsers(d: Db, viewer: number, q: string): Promise<SearchUser[]> {
  const t = q.trim();
  if (t.length < 4) throw new Error("Search string must be 4 (four) characters or more.");
  return d.q<SearchUser>(
    `SELECT id, CASE WHEN show_name THEN name ELSE 'Hidden name' END AS name, CASE WHEN show_email THEN email END AS email,
            CASE WHEN show_phone THEN phone END AS phone, customer_no
     FROM users WHERE id <> $1 AND ((show_name AND name ILIKE $2) OR (show_email AND email ILIKE $2) OR (show_phone AND phone ILIKE $2) OR customer_no = $3)
     ORDER BY name LIMIT 30`,
    [viewer, `%${t}%`, t],
  );
}

/** People the viewer already shares with (count of accounts). */
export async function sharingPartners(d: Db, viewer: number) {
  return d.q<{ id: number; name: string; email: string; accounts: number; pending: number }>(
    `SELECT u.id, u.name, u.email, COUNT(*)::int AS accounts, COUNT(*) FILTER (WHERE sh.status = 'pending')::int AS pending
     FROM shares sh JOIN users u ON u.id = sh.shared_with WHERE sh.owner_id = $1 GROUP BY u.id ORDER BY u.name`,
    [viewer],
  );
}

export type ShareChoice = { accountId: number; permission: "read" | "write"; transfer: boolean };

/** Share (or update the sharing of) several accounts with one person. */
export async function shareAccounts(d: Db, owner: number, withUser: number, choices: ShareChoice[]) {
  if (owner === withUser) throw new Error("You can't share with yourself");
  const [u] = await d.q<{ name: string }>("SELECT name FROM users WHERE id = $1", [withUser]);
  if (!u) throw new Error("User not found");
  if (!choices.length) throw new Error("Please select at least one account to share");
  await d.tx(async (t) => {
    for (const c of choices) {
      const [own] = await t.q<{ name: string }>("SELECT name FROM accounts WHERE id = $1 AND user_id = $2", [c.accountId, owner]);
      if (!own) throw new Error("Account not found");
      const [ex] = await t.q<{ id: number }>("SELECT id FROM shares WHERE account_id = $1 AND shared_with = $2", [c.accountId, withUser]);
      if (ex) await t.q("UPDATE shares SET permission = $1, transfer_enabled = $2 WHERE id = $3", [c.permission, c.transfer, ex.id]);
      else {
        const [s] = await t.q<{ id: number }>(
          "INSERT INTO shares (owner_id, account_id, shared_with, permission, transfer_enabled) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [owner, c.accountId, withUser, c.permission, c.transfer],
        );
        const [me] = await t.q<{ name: string }>("SELECT name FROM users WHERE id = $1", [owner]);
        await t.q("INSERT INTO notifications (user_id, kind, ref_id, text) VALUES ($1, 'activity', $2, $3)", [
          withUser, s.id, `${me.name} wants to share the account "${own.name}" with you (${c.permission === "write" ? "Read & Write" : "Read only"}).`,
        ]);
      }
    }
  });
  return u.name;
}

/** Remove sharing: by the owner (Shared Ledger (My)) or by the receiver (Shared Ledger (Others)). */
export async function removeShare(d: Db, viewer: number, shareId: number) {
  const r = await d.q("DELETE FROM shares WHERE id = $1 AND (owner_id = $2 OR shared_with = $2) RETURNING id", [shareId, viewer]);
  if (!r.length) throw new Error("Not found");
}

/** The receiver accepts or declines a sharing request. */
export async function answerShare(d: Db, viewer: number, shareId: number, accept: boolean) {
  const [s] = await d.q<{ owner_id: number; account: string }>(
    "SELECT sh.owner_id, a.name AS account FROM shares sh JOIN accounts a ON a.id = sh.account_id WHERE sh.id = $1 AND sh.shared_with = $2",
    [shareId, viewer],
  );
  if (!s) throw new Error("Not found");
  if (accept) await d.q("UPDATE shares SET status = 'active' WHERE id = $1", [shareId]);
  else await d.q("DELETE FROM shares WHERE id = $1", [shareId]);
  await d.q("UPDATE notifications SET is_read = true WHERE kind = 'activity' AND ref_id = $1 AND user_id = $2", [shareId, viewer]);
  const [me] = await d.q<{ name: string }>("SELECT name FROM users WHERE id = $1", [viewer]);
  await d.q("INSERT INTO notifications (user_id, kind, text) VALUES ($1, 'activity', $2)", [s.owner_id, `${me.name} ${accept ? "accepted" : "declined"} sharing of "${s.account}".`]);
}

const STATUS_WORD = ["Resend", "Seen", "Rejected", "Approved"];

/** The owner approves (3), rejects (2) or marks seen (1) an entry someone made in their account. */
export async function setEntryStatus(d: Db, viewer: number, entryId: number, status: 1 | 2 | 3) {
  const [e] = await d.q<{ user_id: number; from_owner: number; to_owner: number; status: number }>(
    `SELECT e.user_id, fa.user_id AS from_owner, ta.user_id AS to_owner, e.status FROM entries e
     JOIN accounts fa ON fa.id = e.from_account_id JOIN accounts ta ON ta.id = e.to_account_id WHERE e.id = $1 AND e.deleted_at IS NULL`,
    [entryId],
  );
  if (!e || e.user_id === viewer || (e.from_owner !== viewer && e.to_owner !== viewer)) throw new Error("Not found");
  if (status === 1 && e.status !== 0) return;
  await d.tx(async (t) => {
    await t.q("UPDATE entries SET status = $1 WHERE id = $2", [status, entryId]);
    await t.q("INSERT INTO entry_status_log (entry_id, status, by_user, description) VALUES ($1, $2, $3, $4)", [entryId, status, viewer, status === 1 ? "First Read" : STATUS_WORD[status]]);
    if (status !== 1) await t.q("UPDATE notifications SET is_read = true WHERE kind = 'transaction' AND ref_id = $1 AND user_id = $2", [entryId, viewer]);
    if (status !== 1) {
      const [me] = await t.q<{ name: string }>("SELECT name FROM users WHERE id = $1", [viewer]);
      await t.q("INSERT INTO notifications (user_id, kind, ref_id, text) VALUES ($1, 'activity', NULL, $2)", [e.user_id, `${me.name} ${status === 3 ? "approved" : "rejected"} your transaction.`]);
    }
  });
}

export type StatusStep = { status: number; description: string; by: string | null; at: string };
export async function statusLog(d: Db, entryId: number): Promise<StatusStep[]> {
  return d.q<StatusStep>(
    "SELECT l.status, l.description, u.name AS by, l.at::text AS at FROM entry_status_log l LEFT JOIN users u ON u.id = l.by_user WHERE l.entry_id = $1 ORDER BY l.at, l.id",
    [entryId],
  );
}

/**
 * Transfer: an approved entry in an account shared with the viewer (with Transfer Enable) is copied into
 * the viewer's own books, between the account they pick and an account named after the owner
 * (made once under their PAYABLES category), in the same direction for the viewer. Once only.
 */
export async function transferEntry(d: Db, viewer: number, entryId: number, myAccountId: number) {
  const [e] = await d.q<Entry & { shared_acc: number }>(
    `${ENTRY_SELECT} WHERE e.id = $1 AND e.deleted_at IS NULL AND e.status = 3 AND NOT e.transferred`,
    [entryId],
  );
  if (!e) throw new Error("This transaction can't be transferred");
  const fromA = await access(d, viewer, e.from_account_id);
  const toA = await access(d, viewer, e.to_account_id);
  const shared = [fromA, toA].find((a) => a && !a.mine && a.transfer);
  if (!shared) throw new Error("Transfer is not enabled for this account");
  const mine = await access(d, viewer, myAccountId);
  if (!mine?.mine) throw new Error("Please select one of your own accounts");
  return d.tx(async (t) => {
    const [cat] = await t.q<{ id: number }>("SELECT id FROM categories WHERE user_id = $1 AND kind = 'payables' LIMIT 1", [viewer]);
    if (!cat) throw new Error("PAYABLES category is missing");
    let [sub] = await t.q<{ id: number }>("SELECT id FROM subcategories WHERE category_id = $1 AND name = 'SHARED TRANSFERS'", [cat.id]);
    if (!sub) [sub] = await t.q<{ id: number }>("INSERT INTO subcategories (user_id, category_id, name, color, icon) VALUES ($1, $2, 'SHARED TRANSFERS', '#F6A523', 'friend') RETURNING id", [viewer, cat.id]);
    let [acc] = await t.q<{ id: number }>("SELECT id FROM accounts WHERE subcategory_id = $1 AND name = $2", [sub.id, shared.owner]);
    if (!acc) [acc] = await t.q<{ id: number }>("INSERT INTO accounts (user_id, subcategory_id, name, color, icon) VALUES ($1, $2, $3, '#F6A523', 'friend') RETURNING id", [viewer, sub.id, shared.owner]);
    // The shared account received money (to) -> for the viewer money arrives in their account from the owner.
    const intoShared = e.to_account_id === shared.account_id;
    const id = await addEntry(t, viewer, {
      vtype: intoShared ? "R" : "P",
      date: e.date,
      amount: e.amount,
      fromId: intoShared ? acc.id : myAccountId,
      toId: intoShared ? myAccountId : acc.id,
      note: `Transferred from shared account ${shared.name}${e.note ? ` · ${e.note}` : ""}`,
    });
    await t.q("UPDATE entries SET transferred = true WHERE id = $1", [entryId]);
    await t.q("UPDATE entries SET transfer_of = $1 WHERE id = $2", [entryId, id]);
    return id;
  });
}

/** Unread notifications for the bell, with entry / share details. */
export async function notifications(d: Db, viewer: number) {
  return d.q(
    `SELECT n.id, n.kind, n.text, n.created_at::text AS created_at, n.ref_id,
            CASE WHEN n.kind = 'transaction' THEN (
              SELECT json_build_object('maker', mu.name, 'account', CASE WHEN fa.user_id = $1 THEN fa.name ELSE ta.name END,
                'amount', e.amount::float8, 'date', to_char(e.date, 'YYYY-MM-DD'), 'note', e.note, 'status', e.status)
              FROM entries e JOIN users mu ON mu.id = e.user_id JOIN accounts fa ON fa.id = e.from_account_id JOIN accounts ta ON ta.id = e.to_account_id
              WHERE e.id = n.ref_id AND e.deleted_at IS NULL AND e.status IN (0, 1)) END AS entry,
            CASE WHEN n.kind = 'activity' AND n.ref_id IS NOT NULL THEN (
              SELECT json_build_object('id', sh.id, 'owner', ou.name, 'account', a.name, 'status', sh.status)
              FROM shares sh JOIN users ou ON ou.id = sh.owner_id JOIN accounts a ON a.id = sh.account_id WHERE sh.id = n.ref_id) END AS share
     FROM notifications n WHERE n.user_id = $1 AND NOT n.is_read ORDER BY n.created_at DESC LIMIT 100`,
    [viewer],
  );
}

export async function markRead(d: Db, viewer: number, id: number) {
  await d.q("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2", [id, viewer]);
}

/** Shared Transactions report: entries in shared ledgers (both directions), with their status. */
export async function sharedEntries(d: Db, viewer: number, from: string, to: string) {
  return d.q<Entry & { account: string }>(
    `${ENTRY_FIELDS}, CASE WHEN EXISTS (SELECT 1 FROM shares s WHERE s.account_id = e.to_account_id) THEN ta.name ELSE fa.name END AS account
     ${ENTRY_FROM}
     WHERE e.date BETWEEN $2::date AND $3::date AND EXISTS (
       SELECT 1 FROM shares s WHERE s.status = 'active' AND s.account_id IN (e.from_account_id, e.to_account_id) AND $1 IN (s.owner_id, s.shared_with))
     ORDER BY e.date DESC, e.id DESC`,
    [viewer, from, to],
  );
}
