import { test } from "node:test";
import assert from "node:assert/strict";
import { openPglite } from "../lib/db.ts";
import * as B from "../lib/books.ts";
import * as Bl from "../lib/billing.ts";
import * as A from "../lib/account.ts";

test("funds, paying an invoice extends the plan, 20% referral, reset, level switch", async () => {
  const d = await openPglite();
  const ref = await B.createUser(d, { name: "Ref", email: "ref@x.pk", passwordHash: "x" });
  const u = await B.createUser(d, { name: "Uzma", email: "u@x.pk", passwordHash: "x", referredBy: ref });
  const [before] = await d.q<{ plan_until: string }>("SELECT plan_until::text FROM users WHERE id = $1", [u]);
  const inv = await Bl.invoiceFor(d, u, "yearly");
  await assert.rejects(() => Bl.payInvoice(d, u, inv), /Not enough funds/);
  await Bl.requestFunds(d, u, 1000, "JazzCash", "TID 123");
  assert.equal(await Bl.fundsBalance(d, u), 0); // waits for confirmation
  const [f] = await d.q<{ id: number }>("SELECT id FROM funds WHERE user_id = $1", [u]);
  await Bl.decideFunds(d, f.id, true);
  assert.equal(await Bl.fundsBalance(d, u), 1000);
  await Bl.payInvoice(d, u, inv);
  assert.equal(await Bl.fundsBalance(d, u), 0);
  assert.equal(await Bl.fundsBalance(d, ref), 200); // 20% of USD 10
  const [after] = await d.q<{ plan: string; plan_until: string; data_mb: number }>("SELECT plan, plan_until::text, data_mb FROM users WHERE id = $1", [u]);
  assert.equal(after.plan, "yearly");
  assert.equal(after.data_mb, 100);
  assert.ok(after.plan_until > before.plan_until);
  // level switch + reset
  await A.switchLevel(d, u, 1);
  await assert.rejects(() => A.switchLevel(d, u, 4), /Select Level/);
  const accs = await B.accountBalances(d, u);
  await B.addEntry(d, u, { vtype: "P", date: "2026-11-01", amount: 100, fromId: accs[0].id, toId: accs[1].id });
  await A.resetAccount(d, u);
  const [{ n }] = await d.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM entries WHERE user_id = $1", [u]);
  assert.equal(n, 0);
  assert.equal((await B.categories(d, u)).length, 9);
  await assert.rejects(() => A.setMpin(d, u, "12", "12"), /4 Digit/);
  await A.setMpin(d, u, "1234", "1234");
  await assert.rejects(() => A.checkMpin(d, u, "9999"), /Not Matched/);
});

test("group package: 5 licenses, members covered while the payer's group plan is active", async () => {
  const { openPglite } = await import("../lib/db.ts");
  const B = await import("../lib/books.ts");
  const Bl = await import("../lib/billing.ts");
  const A = await import("../lib/account.ts");
  const P = await import("../lib/plan.ts");
  const d = await openPglite();
  const owner = await B.createUser(d, { name: "Owner", email: `o${Math.random()}@x.pk`, passwordHash: "x" });
  await assert.rejects(() => A.addLicense(d, owner, { name: "M", email: "m@x.pk", phone: "" }), /Group package/);
  await d.q("INSERT INTO funds (user_id, kind, amount_cents, status) VALUES ($1, 'add', 3000, 'Completed')", [owner]);
  await Bl.payInvoice(d, owner, await Bl.invoiceFor(d, owner, "group_monthly"));
  const memberEmail = `m${Math.random()}@x.pk`;
  for (let i = 0; i < 5; i++) await A.addLicense(d, owner, { name: `M${i}`, email: i === 0 ? memberEmail : `m${i}${Math.random()}@x.pk`, phone: "" });
  await assert.rejects(() => A.addLicense(d, owner, { name: "M6", email: "six@x.pk", phone: "" }), /Limit Exceeded/);
  const member = await B.createUser(d, { name: "Mem", email: memberEmail, passwordHash: "x" });
  await d.q("UPDATE users SET plan_until = CURRENT_DATE - 1 WHERE id = $1", [member]);
  const [m] = await d.q<{ id: number; email: string; plan_until: string; data_mb: number; is_admin: boolean }>("SELECT id, email, to_char(plan_until, 'YYYY-MM-DD') AS plan_until, data_mb, false AS is_admin FROM users WHERE id = $1", [member]);
  assert.equal(await P.lockState(d, m), "ok", "covered by the group");
  await d.q("UPDATE users SET plan_until = CURRENT_DATE - 1 WHERE id = $1", [owner]);
  assert.equal(await P.lockState(d, m), "date", "group expired: locked again");
});
