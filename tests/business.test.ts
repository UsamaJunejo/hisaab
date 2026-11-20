import { test } from "node:test";
import assert from "node:assert/strict";
import { openPglite } from "../lib/db.ts";
import * as B from "../lib/books.ts";
import * as Z from "../lib/business.ts";

test("business module: purchase, sale, payments, stock, balances, aging, profit, and the books stay at zero", async () => {
  const d = await openPglite();
  const me = await B.createUser(d, { name: "Shop Owner", email: `s${Math.random()}@x.pk`, passwordHash: "x" });
  const biz = await Z.createBusiness(d, me, { name: "Ali Store" });
  await assert.rejects(() => Z.createBusiness(d, me, { name: "ali store" }), /already/);
  const cash = (await Z.moneyAccounts(d, me)).find((a) => a.name === "CASH")!.id;
  await Z.saveRow(d, me, biz, "taxes", 0, { name: "GST", kind: "percent", rate: "10" });
  await Z.saveRow(d, me, biz, "discounts", 0, { name: "Eid", kind: "amount", rate: "50" });
  const [tax] = await Z.listRows(d, me, biz, "taxes");
  const [disc] = await Z.listRows(d, me, biz, "discounts");
  await Z.saveProduct(d, me, biz, 0, { name: "Rice 1kg", category_id: null, type: "Stock", barcode: "", sale_price: 300_00, purchase_price: 250_00, tax_id: null, size: "", color: "", location: "", low_stock: 5 });
  const [rice] = await Z.products(d, me, biz);
  await Z.saveParty(d, me, biz, "vendor", 0, { name: "Wholesale Co", terms: "CREDIT" });
  await Z.saveParty(d, me, biz, "customer", 0, { name: "Bilal" });
  const [vendor] = await Z.parties(d, me, biz, "vendor");
  const [cust] = await Z.parties(d, me, biz, "customer");

  // buy 10 at 250, pay 1,000 now
  await Z.createDoc(d, me, biz, { kind: "purchase", partyId: vendor.id, warehouseId: null, date: "2026-09-01", lines: [{ productId: rice.id, qty: 10, price: 250_00 }], paidNow: 1000_00, payAccountId: cash });
  // sell 4 at 300 = 1,200, discount 50, GST 10% of 1,150 = 115 -> 1,265; customer pays 500 now
  const saleId = await Z.createDoc(d, me, biz, { kind: "sale", partyId: cust.id, warehouseId: null, date: "2026-11-10", lines: [{ productId: rice.id, qty: 4, price: 300_00 }], discountId: disc.id as number, taxId: tax.id as number, paidNow: 500_00, payAccountId: cash });
  const [sale] = await Z.docs(d, me, biz, "sale");
  assert.deepEqual([sale.subtotal, sale.discount, sale.tax, sale.total, sale.paid], [1200_00, 50_00, 115_00, 1265_00, 500_00]);
  assert.equal(sale.number, "S-000001");
  // walk-in cash sale of 1 (no customer)
  await Z.createDoc(d, me, biz, { kind: "sale", partyId: null, warehouseId: null, date: "2026-11-11", lines: [{ productId: rice.id, qty: 1, price: 300_00 }] });
  // expense voucher paid straight from cash
  const elec = (await Z.expenseAccounts(d, me)).find((a) => a.name === "ELECTRICITY")!.id;
  await Z.createDoc(d, me, biz, { kind: "expense", partyId: null, warehouseId: null, date: "2026-11-12", lines: [], amount: 800_00, expenseAccountId: elec, payAccountId: cash });

  const st = (await Z.stock(d, me, biz))[0];
  assert.equal(st.on_hand, 5);
  assert.equal(st.value, 1250_00);
  assert.equal(st.low, true, "5 left is at the low-stock level");

  const cb = (await Z.partyBalances(d, me, biz, "customer"))[0];
  assert.equal(cb.balance, 765_00);
  const vb = (await Z.partyBalances(d, me, biz, "vendor"))[0];
  assert.equal(vb.balance, 1500_00);
  // the customer's and vendor's accounts in the books say the same (customer owes +765, we owe vendor -1,500)
  const acc = new Map((await B.accountBalances(d, me)).map((a) => [a.id, a.balance]));
  assert.equal(acc.get(cust.account_id), 765_00);
  assert.equal(acc.get(vendor.account_id), -1500_00);
  // and everything still adds up to zero
  assert.equal((await B.categories(d, me)).reduce((s, c) => s + c.balance, 0), 0);

  // vendor payment, aging and profit
  await Z.addPayment(d, me, biz, { kind: "vendor", partyId: vendor.id, date: "2026-11-15", amount: 1500_00, accountId: cash });
  assert.equal((await Z.partyBalances(d, me, biz, "vendor"))[0].balance, 0);
  const ag = await Z.aging(d, me, biz, "customer", "2026-12-20");
  assert.equal(ag[0].d31, 765_00, "40 days old");
  const pr = await Z.productProfit(d, me, biz, B.ALL);
  assert.deepEqual([pr[0].qty, pr[0].sales, pr[0].cost, pr[0].profit], [5, 1500_00, 1250_00, 250_00]);

  // deleting the sale takes its entry out of the books; the 500 paid stays as money on the customer's account
  await Z.deleteDoc(d, me, biz, saleId);
  assert.equal((await Z.partyBalances(d, me, biz, "customer"))[0].balance, -500_00);
  await assert.rejects(() => Z.deleteProduct(d, me, biz, rice.id), /on invoices/);
  await assert.rejects(() => Z.deleteParty(d, me, biz, vendor.id), /invoices or payments/);
  // someone else can't touch it
  const other = await B.createUser(d, { name: "Other", email: `o${Math.random()}@x.pk`, passwordHash: "x" });
  await assert.rejects(() => Z.products(d, other, biz), /not found/);
});
