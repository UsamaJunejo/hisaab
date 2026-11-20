"use server";

import { cookies } from "next/headers";
import { act, int, str } from "@/lib/act";
import { toPaisa } from "@/lib/format";
import { lockState } from "@/lib/plan";
import { BIZ_COOKIE } from "@/lib/biz-session";
import * as Z from "@/lib/business";
import type { User } from "@/lib/auth";
import type { Db } from "@/lib/db";

const back = (f: FormData, fallback: string) => { const b = str(f, "back"); return b.startsWith("/business") ? b : fallback; };
async function writable(u: User, d: Db) {
  if ((await lockState(d, u)) !== "ok") throw new Error("Your plan has ended or your data limit is used up. Please pay to continue.");
}
const setBiz = async (id: number) => (await cookies()).set(BIZ_COOKIE, String(id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });

export async function saveBusinessAction(f: FormData) {
  const id = int(f, "id");
  const p = { name: str(f, "name"), address: str(f, "address"), phone: str(f, "phone"), email: str(f, "email"), fax: str(f, "fax"), tax_no: str(f, "tax_no"), website: str(f, "website"), country: str(f, "country") };
  await act(id ? "/business/profile" : "/business", async (u, d) => {
    if (id) return Z.updateBusiness(d, u.id, id, p);
    await setBiz(await Z.createBusiness(d, u.id, p));
  }, id ? "Business Profile Updated" : "Business created. Your customers, vendors, sales and purchases now show in your books too.");
}

export async function selectBusinessAction(f: FormData) {
  await act("/business", async (u, d) => { const b = await Z.getBusiness(d, u.id, int(f, "biz")); await setBiz(b.id); });
}

export async function saveListAction(f: FormData) {
  const key = str(f, "key") as Z.ListKey;
  if (!(key in Z.LISTS)) return;
  const row = Object.fromEntries(Z.LISTS[key].fields.map(([n]) => [n, str(f, n)]));
  await act(`/business/settings/${key}`, (u, d) => Z.saveRow(d, u.id, int(f, "biz"), key, int(f, "id"), row), "Saved");
}

export async function deleteListAction(f: FormData) {
  const key = str(f, "key") as Z.ListKey;
  if (!(key in Z.LISTS)) return;
  await act(`/business/settings/${key}`, (u, d) => Z.deleteRow(d, u.id, int(f, "biz"), key, int(f, "id")), "Deleted");
}

export async function savePartyAction(f: FormData) {
  const kind = str(f, "kind") === "vendor" ? "vendor" : "customer";
  const row = Object.fromEntries(Z.PARTY_FIELDS.map((k) => [k, str(f, k)]));
  await act(`/business/${kind}s`, async (u, d) => { await writable(u, d); await Z.saveParty(d, u.id, int(f, "biz"), kind, int(f, "id"), row); }, kind === "vendor" ? "Vendor saved" : "Customer saved");
}

export async function deletePartyAction(f: FormData) {
  const kind = str(f, "kind") === "vendor" ? "vendor" : "customer";
  await act(`/business/${kind}s`, (u, d) => Z.deleteParty(d, u.id, int(f, "biz"), int(f, "id")), "Deleted");
}

export async function saveProductAction(f: FormData) {
  await act("/business/products", async (u, d) => {
    await writable(u, d);
    await Z.saveProduct(d, u.id, int(f, "biz"), int(f, "id"), {
      name: str(f, "name"), category_id: int(f, "category_id") || null, type: str(f, "type"), barcode: str(f, "barcode"),
      sale_price: toPaisa(str(f, "sale_price")), purchase_price: toPaisa(str(f, "purchase_price")), tax_id: int(f, "tax_id") || null,
      size: str(f, "size"), color: str(f, "color"), location: str(f, "location"), low_stock: Number(str(f, "low_stock")) || 0,
    });
  }, "Product saved");
}

export async function deleteProductAction(f: FormData) {
  await act("/business/products", (u, d) => Z.deleteProduct(d, u.id, int(f, "biz"), int(f, "id")), "Product deleted");
}

export async function createDocAction(f: FormData) {
  const kind = (["purchase", "sale", "expense"] as const).find((k) => k === str(f, "kind")) ?? "sale";
  let lines: { productId: number; qty: number; price: number }[] = [];
  try { lines = (JSON.parse(str(f, "lines") || "[]") as { productId: number; qty: string; price: string }[]).map((l) => ({ productId: Number(l.productId), qty: Number(l.qty), price: toPaisa(String(l.price)) })); } catch { lines = []; }
  await act(back(f, `/business/${kind}`), async (u, d) => {
    await writable(u, d);
    await Z.createDoc(d, u.id, int(f, "biz"), {
      kind, partyId: int(f, "party") || null, warehouseId: int(f, "warehouse") || null, date: str(f, "date"), note: str(f, "note"), lines,
      amount: toPaisa(str(f, "amount")), expenseAccountId: int(f, "expense_account") || null,
      discountId: int(f, "discount") || null, taxId: int(f, "tax") || null, paidNow: toPaisa(str(f, "paid")) || 0, payAccountId: int(f, "pay_account") || null,
    });
  }, kind === "sale" ? "Sale Invoice Saved" : kind === "purchase" ? "Purchase Saved" : "Expense Voucher Saved");
}

export async function deleteDocAction(f: FormData) {
  await act(back(f, "/business"), (u, d) => Z.deleteDoc(d, u.id, int(f, "biz"), int(f, "id")), "Deleted. Its entry is in the Deleted Transactions Log.");
}

export async function addPaymentAction(f: FormData) {
  const kind = str(f, "kind") === "vendor" ? "vendor" : "customer";
  await act(back(f, `/business/payments/${kind}`), async (u, d) => {
    await writable(u, d);
    await Z.addPayment(d, u.id, int(f, "biz"), { kind, partyId: int(f, "party") || null, docId: int(f, "doc") || null, date: str(f, "date"), amount: toPaisa(str(f, "amount")), accountId: int(f, "account"), note: str(f, "note") });
  }, kind === "vendor" ? "Vendor Payment Saved" : "Customer Payment Saved");
}

export async function deletePaymentAction(f: FormData) {
  const kind = str(f, "kind") === "vendor" ? "vendor" : "customer";
  await act(`/business/payments/${kind}`, (u, d) => Z.deletePayment(d, u.id, int(f, "biz"), int(f, "id")), "Payment deleted");
}
