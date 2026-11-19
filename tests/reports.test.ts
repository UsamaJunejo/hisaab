import { test } from "node:test";
import assert from "node:assert/strict";
import { openPglite } from "../lib/db.ts";
import * as B from "../lib/books.ts";
import * as R from "../lib/reports.ts";

test("net worth, profit/loss, balance sheet check total, group ledger columns", async () => {
  const d = await openPglite();
  const uid = await B.createUser(d, { name: "Sara", email: "s@x.pk", passwordHash: "x" });
  const accs = await B.accountBalances(d, uid);
  const acc = (n: string) => accs.find((a) => a.name === n)!.id;
  await B.addEntry(d, uid, { vtype: "R", date: "2026-11-01", amount: 50000_00, fromId: acc("CAPITAL"), toId: acc("CASH") });
  await B.addEntry(d, uid, { vtype: "R", date: "2026-11-02", amount: 20000_00, fromId: acc("SALARY"), toId: acc("BANK ACCOUNT") });
  await B.addEntry(d, uid, { vtype: "P", date: "2026-11-03", amount: 5000_00, fromId: acc("CASH"), toId: acc("GROCERY") });
  await B.addEntry(d, uid, { vtype: "R", date: "2026-11-04", amount: 10000_00, fromId: acc("BANK LOAN"), toId: acc("CASH") });
  const t = await R.tree(d, uid, { from: null, to: "2026-12-31" });
  // own 55,000 cash + 20,000 bank; owe 10,000 loan
  assert.equal(R.netWorth(t), 65000_00);
  assert.deepEqual(R.profitLoss(t), { label: "NET PROFIT", amount: 15000_00, raw: -15000_00 });
  assert.equal(R.sumNature(t, "Assets", "Liabilities", "Equity", "Expenses", "Income", "Shared"), 0);
  const gl = await R.groupLedger(d, uid, "my", "high");
  const cash = gl.find((r) => r.name === "CASH")!;
  assert.deepEqual([cash.receipts, cash.payments, cash.balance], [60000_00, 5000_00, 55000_00]);
  assert.equal(gl[0].name, "CASH"); // highest balance first
});
