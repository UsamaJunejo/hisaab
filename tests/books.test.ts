import { test } from "node:test";
import assert from "node:assert/strict";
import { openPglite } from "../lib/db.ts";
import * as B from "../lib/books.ts";

async function setup() {
  const d = await openPglite();
  const uid = await B.createUser(d, { name: "Ali", email: `a${Math.random()}@x.pk`, passwordHash: "x" });
  const accs = await B.accountBalances(d, uid);
  const acc = (n: string) => accs.find((a) => a.name === n)!.id;
  return { d, uid, acc };
}

test("default chart, balances = in - out, everything sums to zero", async () => {
  const { d, uid, acc } = await setup();
  const cats = await B.categories(d, uid);
  assert.deepEqual(cats.map((c) => c.name), ["ASSETS", "BANK", "CASH", "EQUITY", "EXPENSE", "INCOME", "LIABILITIES", "PAYABLES", "RECEIVABLES"]);
  await B.addEntry(d, uid, { vtype: "R", date: "2026-11-01", amount: 100000_00, fromId: acc("CAPITAL"), toId: acc("CASH") });
  await B.addEntry(d, uid, { vtype: "P", date: "2026-11-05", amount: 2500_00, fromId: acc("CASH"), toId: acc("ELECTRICITY") });
  const c = Object.fromEntries((await B.categories(d, uid)).map((x) => [x.name, x.balance]));
  assert.equal(c.CASH, 97500_00);
  assert.equal(c.EQUITY, -100000_00);
  assert.equal(c.EXPENSE, 2500_00);
  assert.equal(Object.values(c).reduce((s, v) => s + v, 0), 0);
  const l = await B.ledger(d, uid, acc("CASH"), { from: "2026-11-02", to: "2026-11-30" });
  assert.equal(l.opening, 100000_00);
  assert.equal(l.rows.length, 1);
  assert.equal(l.rows[0].out, 2500_00);
  assert.equal(l.closing, 97500_00);
  const t = await B.dashboardTotals(d, uid, B.ALL);
  assert.deepEqual([t.payments, t.receipts], [2500_00, 100000_00]);
});

test("checks: same account, zero amount, delete rules, restore", async () => {
  const { d, uid, acc } = await setup();
  await assert.rejects(() => B.addEntry(d, uid, { vtype: "P", date: "2026-11-01", amount: 5, fromId: acc("CASH"), toId: acc("CASH") }), /same account/);
  await assert.rejects(() => B.addEntry(d, uid, { vtype: "P", date: "2026-11-01", amount: 0, fromId: acc("CASH"), toId: acc("GAS") }), /Invalid input/);
  const id = await B.addEntry(d, uid, { vtype: "P", date: "2026-11-01", amount: 500, fromId: acc("CASH"), toId: acc("GAS") });
  await assert.rejects(() => B.deleteAccount(d, uid, acc("GAS")), /delete all transactions first/);
  const sub = (await B.subcategories(d, uid)).find((s) => s.name === "UTILITY")!;
  await assert.rejects(() => B.deleteSub(d, uid, sub.id), /delete all accounts first/);
  const cat = (await B.categories(d, uid)).find((c) => c.name === "EXPENSE")!;
  await assert.rejects(() => B.deleteCategory(d, uid, cat.id), /delete all sub categories first/);
  await B.deleteEntry(d, uid, id);
  assert.equal((await B.categories(d, uid)).find((c) => c.name === "CASH")!.balance, 0);
  await B.restoreEntry(d, uid, id);
  assert.equal((await B.categories(d, uid)).find((c) => c.name === "CASH")!.balance, -500);
  await B.deleteEntry(d, uid, id);
  await B.deleteAccount(d, uid, acc("GAS"));
});

test("payables/receivables keep their name and nature", async () => {
  const { d, uid } = await setup();
  const p = (await B.categories(d, uid)).find((c) => c.kind === "payables")!;
  await B.updateCategory(d, uid, p.id, { name: "X", nature: "Assets", color: "#123456", icon: "cash" });
  const after = await B.getCategory(d, uid, p.id);
  assert.deepEqual([after.name, after.nature, after.color], ["PAYABLES", "Liabilities", "#123456"]);
});
