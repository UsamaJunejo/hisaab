import { test } from "node:test";
import assert from "node:assert/strict";
import { openPglite } from "../lib/db.ts";
import * as B from "../lib/books.ts";
import * as S from "../lib/share.ts";

test("share, accept, entries need approval, transfer once", async () => {
  const d = await openPglite();
  const a = await B.createUser(d, { name: "Ahmed", email: "ahmed@x.pk", passwordHash: "x" });
  const b = await B.createUser(d, { name: "Bilal", email: "bilal@x.pk", passwordHash: "x" });
  const accA = Object.fromEntries((await B.accountBalances(d, a)).map((x) => [x.name, x.id]));
  const accB = Object.fromEntries((await B.accountBalances(d, b)).map((x) => [x.name, x.id]));
  // Ahmed keeps an account for Bilal and shares it (Read & Write, Transfer Enable).
  const sub = (await B.subcategories(d, a)).find((s) => s.name === "PRIVATE LOANS")!;
  const khata = await B.addAccount(d, a, sub.id, { name: "BILAL KHATA", color: "#000000", icon: "friend" });
  await assert.rejects(() => S.searchUsers(d, a, "bil"), /4 \(four\)/);
  assert.equal((await S.searchUsers(d, a, "bilal"))[0].id, b);
  await S.shareAccounts(d, a, b, [{ accountId: khata, permission: "write", transfer: true }]);
  assert.equal((await B.sharedWithMe(d, b)).length, 0); // not accepted yet
  const [share] = await d.q<{ id: number }>("SELECT id FROM shares");
  await S.answerShare(d, b, share.id, true);
  assert.equal((await B.sharedWithMe(d, b)).length, 1);
  // Ahmed lends Bilal 10,000 (cash -> khata): counts for both immediately.
  const lend = await B.addEntry(d, a, { vtype: "P", date: "2026-11-01", amount: 10000_00, fromId: accA.CASH, toId: khata });
  assert.equal((await B.sharedWithMe(d, b))[0].balance, 10000_00);
  // Bilal adds 4,000 from his own cash to the khata: it waits for Ahmed's approval before it counts for Ahmed.
  const repay = await B.addEntry(d, b, { vtype: "P", date: "2026-11-05", amount: 4000_00, fromId: accB.CASH, toId: khata });
  const bal = async (viewer: number) => (await B.ledger(d, viewer, khata, B.ALL)).closing;
  assert.equal(await bal(a), 10000_00); // Ahmed: not approved yet
  assert.equal((await B.ledger(d, a, khata, B.ALL)).pending.length, 1);
  assert.equal(await bal(b), 14000_00); // Bilal sees his own entry straight away
  const notes = await S.notifications(d, a);
  assert.ok(notes.some((n) => (n as { kind: string }).kind === "transaction"));
  await S.setEntryStatus(d, a, repay, 3);
  assert.equal(await bal(a), 14000_00);
  // Read only can't add.
  await d.q("UPDATE shares SET permission = 'read'");
  await assert.rejects(() => B.addEntry(d, b, { vtype: "P", date: "2026-11-06", amount: 1, fromId: accB.CASH, toId: khata }), /Read only/);
  // Bilal transfers Ahmed's loan entry into his own books once.
  await S.transferEntry(d, b, lend, accB.CASH);
  await assert.rejects(() => S.transferEntry(d, b, lend, accB.CASH), /can't be transferred/);
  const bAccs = Object.fromEntries((await B.accountBalances(d, b)).map((x) => [x.name, x.balance]));
  assert.equal(bAccs.CASH, -4000_00 + 10000_00);
  assert.equal(bAccs.Ahmed, -10000_00);
  // Remove sharing.
  await S.removeShare(d, b, share.id);
  assert.equal((await B.sharedWithMe(d, b)).length, 0);
});
