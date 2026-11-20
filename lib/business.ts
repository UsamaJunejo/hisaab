import type { Db } from "./db.ts";
import * as B from "./books.ts";
import { today } from "./format.ts";

// ======================================================================================
// BUSINESS MODULE (MunshiBaba's "Business Management System"): products, vendors, customers,
// purchases, sales, expenses, payments and stock, for a shop or restaurant.
//
// It is joined to the owner's own books, so nothing is kept twice:
// - every customer is an account under RECEIVABLES (in "<BUSINESS> CUSTOMERS"), every vendor an account under PAYABLES;
// - a sale invoice is a Receipt from "<BUSINESS> SALES" to the customer (they owe you);
// - a purchase invoice is a Payment from the vendor to "<BUSINESS> PURCHASES" (you owe them);
// - an expense voucher is a Payment from the vendor (or straight from cash / bank) to the expense account;
// - money received from a customer goes from their account to your cash / bank; paying a vendor goes the other way.
// So customer and vendor balances, the dashboard's PAYABLES / RECEIVABLES and every report stay right.
// Money is in paisa / cents of the owner's currency; quantities can have 3 decimals.
// ======================================================================================

export type Business = { id: number; owner_id: number; name: string; address: string | null; phone: string | null; email: string | null; fax: string | null; tax_no: string | null; website: string | null; country: string | null;
  customers_sub_id: number; vendors_sub_id: number; walkin_account_id: number; sales_account_id: number; purchases_account_id: number };
export type PartyKind = "customer" | "vendor";
export type DocKind = "purchase" | "sale" | "expense";
type IdRow = { id: number };

const t = (v: unknown) => String(v ?? "").trim();
const opt = (v: unknown) => t(v) || null;

export async function businesses(d: Db, owner: number) {
  return d.q<Business>("SELECT * FROM businesses WHERE owner_id = $1 ORDER BY id", [owner]);
}

export async function getBusiness(d: Db, owner: number, id: number): Promise<Business> {
  const [b] = await d.q<Business>("SELECT * FROM businesses WHERE id = $1 AND owner_id = $2", [id, owner]);
  if (!b) throw new Error("Business not found");
  return b;
}

/** The first category of a nature (making it if there is none), for linking the business into the books. */
async function categoryFor(d: Db, owner: number, kind: "receivables" | "payables" | "Income" | "Expenses") {
  const [c] = kind === "receivables" || kind === "payables"
    ? await d.q<IdRow>("SELECT id FROM categories WHERE user_id = $1 AND kind = $2 ORDER BY id LIMIT 1", [owner, kind])
    : await d.q<IdRow>("SELECT id FROM categories WHERE user_id = $1 AND kind = 'normal' AND nature = $2 ORDER BY sort, id LIMIT 1", [owner, kind]);
  if (c) return c.id;
  if (kind === "receivables" || kind === "payables") {
    const [r] = await d.q<IdRow>(
      "INSERT INTO categories (user_id, name, nature, color, icon, kind, sort) VALUES ($1, $2, $3, $4, $5, $6, 99) RETURNING id",
      [owner, kind.toUpperCase(), kind === "payables" ? "Liabilities" : "Assets", kind === "payables" ? "#F6A523" : "#1E8955", kind === "payables" ? "payment" : "receipt", kind],
    );
    return r.id;
  }
  return B.addCategory(d, owner, { name: kind === "Income" ? "INCOME" : "EXPENSE", nature: kind, color: kind === "Income" ? "#14B14B" : "#EA6146", icon: kind === "Income" ? "chart" : "bars" });
}

export type ProfileInput = { name: string; address?: string; phone?: string; email?: string; fax?: string; tax_no?: string; website?: string; country?: string };

/** Business Profile: a new business also gets its places in the owner's books (customers, vendors, sales, purchases). */
export async function createBusiness(d: Db, owner: number, p: ProfileInput) {
  const name = t(p.name).toUpperCase();
  if (!name) throw new Error("Please enter the business name");
  return d.tx(async (x) => {
    const [dup] = await x.q("SELECT 1 FROM businesses WHERE owner_id = $1 AND upper(name) = $2", [owner, name]);
    if (dup) throw new Error("You already have a business with this name");
    const customers = await B.addSub(x, owner, await categoryFor(x, owner, "receivables"), { name: `${name} CUSTOMERS`, color: "#1E8955", icon: "client" });
    const vendors = await B.addSub(x, owner, await categoryFor(x, owner, "payables"), { name: `${name} VENDORS`, color: "#F6A523", icon: "shop" });
    const walkin = await B.addAccount(x, owner, customers, { name: "WALK IN CUSTOMER", color: "#1E8955", icon: "person" });
    const salesSub = await B.addSub(x, owner, await categoryFor(x, owner, "Income"), { name: `${name} SALES`, color: "#14B14B", icon: "chart" });
    const sales = await B.addAccount(x, owner, salesSub, { name: "SALES", color: "#14B14B", icon: "chart" });
    const purSub = await B.addSub(x, owner, await categoryFor(x, owner, "Expenses"), { name: `${name} PURCHASES`, color: "#EA6146", icon: "shop" });
    const purchases = await B.addAccount(x, owner, purSub, { name: "PURCHASES", color: "#EA6146", icon: "shop" });
    const [r] = await x.q<IdRow>(
      `INSERT INTO businesses (owner_id, name, address, phone, email, fax, tax_no, website, country, customers_sub_id, vendors_sub_id, walkin_account_id, sales_account_id, purchases_account_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [owner, name, opt(p.address), opt(p.phone), opt(p.email), opt(p.fax), opt(p.tax_no), opt(p.website), opt(p.country), customers, vendors, walkin, sales, purchases],
    );
    await x.q("INSERT INTO biz_warehouses (business_id, name) VALUES ($1, 'MAIN STORE')", [r.id]);
    await x.q("INSERT INTO biz_parties (business_id, kind, name, account_id) VALUES ($1, 'customer', 'WALK IN CUSTOMER', $2)", [r.id, walkin]);
    return r.id;
  });
}

export async function updateBusiness(d: Db, owner: number, id: number, p: ProfileInput) {
  await getBusiness(d, owner, id);
  const name = t(p.name).toUpperCase();
  if (!name) throw new Error("Please enter the business name");
  await d.q("UPDATE businesses SET name = $1, address = $2, phone = $3, email = $4, fax = $5, tax_no = $6, website = $7, country = $8 WHERE id = $9",
    [name, opt(p.address), opt(p.phone), opt(p.email), opt(p.fax), opt(p.tax_no), opt(p.website), opt(p.country), id]);
}

// ---------------------------------------------------------------- simple setup lists (warehouses, tax, discount, categories)

export const LISTS = {
  warehouses: { table: "biz_warehouses", title: "Warehouses / Store's", fields: [["name", "Warehouse / Store Name", true], ["address", "Address"], ["city", "City"], ["state", "State"], ["zip", "Zip"], ["country", "Country"], ["contact", "Contact Person"], ["email", "Email"], ["phone", "Phone"], ["fax", "Fax"]] },
  taxes: { table: "biz_taxes", title: "Tax Setup", fields: [["name", "Tax Name", true], ["kind", "Tax Type", true, ["percent", "amount"]], ["rate", "Tax Rate", true, "number"]] },
  discounts: { table: "biz_discounts", title: "Discount Setup", fields: [["name", "Discount Name", true], ["kind", "Discount Type", true, ["percent", "amount"]], ["rate", "Discount Rate", true, "number"]] },
  categories: { table: "biz_categories", title: "Product Categories", fields: [["name", "Category Name", true]] },
} as const satisfies Record<string, { table: string; title: string; fields: readonly (readonly [string, string, boolean?, (readonly string[] | "number")?])[] }>;
export type ListKey = keyof typeof LISTS;

export async function listRows(d: Db, owner: number, biz: number, key: ListKey) {
  await getBusiness(d, owner, biz);
  const L = LISTS[key];
  const cols = ["id", ...L.fields.map((f) => f[0])].map((c) => (c === "rate" ? "rate::float8 AS rate" : c)).join(", ");
  return d.q<Record<string, string | number | null>>(`SELECT ${cols} FROM ${L.table} WHERE business_id = $1 ORDER BY name`, [biz]);
}

export async function saveRow(d: Db, owner: number, biz: number, key: ListKey, id: number, f: Record<string, unknown>) {
  await getBusiness(d, owner, biz);
  const L = LISTS[key];
  const vals = L.fields.map(([name, label, req, kind]) => {
    const v = t(f[name]);
    if (req && !v) throw new Error(`Please enter ${label}`);
    if (kind === "number" && !(Number(v) >= 0)) throw new Error(`${label} must be a number`);
    if (Array.isArray(kind) && !kind.includes(v)) throw new Error(`Please choose ${label}`);
    return name === "name" ? v.toUpperCase() : kind === "number" ? Number(v) : v || null;
  });
  const names = L.fields.map((x) => x[0]);
  if (id) {
    await d.q(`UPDATE ${L.table} SET ${names.map((n, i) => `${n} = $${i + 1}`).join(", ")} WHERE id = $${names.length + 1} AND business_id = $${names.length + 2}`, [...vals, id, biz]);
  } else {
    await d.q(`INSERT INTO ${L.table} (business_id, ${names.join(", ")}) VALUES ($1, ${names.map((_, i) => `$${i + 2}`).join(", ")})`, [biz, ...vals]);
  }
}

export async function deleteRow(d: Db, owner: number, biz: number, key: ListKey, id: number) {
  await getBusiness(d, owner, biz);
  if (key === "warehouses") {
    const [{ n }] = await d.q<{ n: number }>("SELECT COUNT(*)::int AS n FROM biz_warehouses WHERE business_id = $1", [biz]);
    if (n <= 1) throw new Error("Keep at least one warehouse / store");
  }
  await d.q(`DELETE FROM ${LISTS[key].table} WHERE id = $1 AND business_id = $2`, [id, biz]);
}

// ---------------------------------------------------------------- customers & vendors

export type Party = { id: number; kind: PartyKind; name: string; company: string | null; contact: string | null; email: string | null; address: string | null; city: string | null; state: string | null; country: string | null; tax_no: string | null; st_no: string | null; terms: string | null; account_id: number };
export const PARTY_FIELDS = ["name", "company", "contact", "email", "address", "city", "state", "country", "tax_no", "st_no", "terms"] as const;

export async function parties(d: Db, owner: number, biz: number, kind: PartyKind) {
  await getBusiness(d, owner, biz);
  return d.q<Party>("SELECT * FROM biz_parties WHERE business_id = $1 AND kind = $2 ORDER BY name", [biz, kind]);
}

/** Add or edit a customer / vendor; each one is an account in the books (so its balance shows everywhere). */
export async function saveParty(d: Db, owner: number, biz: number, kind: PartyKind, id: number, f: Record<string, unknown>) {
  const b = await getBusiness(d, owner, biz);
  const name = t(f.name).toUpperCase();
  if (!name) throw new Error(kind === "customer" ? "Please enter the customer name" : "Please enter the vendor name");
  const email = t(f.email);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Please enter a valid email");
  const vals = PARTY_FIELDS.map((k) => (k === "name" ? name : opt(f[k])));
  await d.tx(async (x) => {
    const [dup] = await x.q("SELECT 1 FROM biz_parties WHERE business_id = $1 AND kind = $2 AND name = $3 AND id <> $4", [biz, kind, name, id]);
    if (dup) throw new Error(`A ${kind} with this name already exists`);
    if (id) {
      const [p] = await x.q<Party>("SELECT * FROM biz_parties WHERE id = $1 AND business_id = $2", [id, biz]);
      if (!p) throw new Error("Not found");
      await x.q(`UPDATE biz_parties SET ${PARTY_FIELDS.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = $${PARTY_FIELDS.length + 1}`, [...vals, id]);
      await x.q("UPDATE accounts SET name = $1 WHERE id = $2 AND user_id = $3", [name, p.account_id, owner]);
    } else {
      const acc = await B.addAccount(x, owner, kind === "customer" ? b.customers_sub_id : b.vendors_sub_id, { name, color: kind === "customer" ? "#1E8955" : "#F6A523", icon: kind === "customer" ? "client" : "shop" });
      await x.q(`INSERT INTO biz_parties (business_id, kind, ${PARTY_FIELDS.join(", ")}, account_id) VALUES ($1, $2, ${PARTY_FIELDS.map((_, i) => `$${i + 3}`).join(", ")}, $${PARTY_FIELDS.length + 3})`, [biz, kind, ...vals, acc]);
    }
  });
}

export async function deleteParty(d: Db, owner: number, biz: number, id: number) {
  await getBusiness(d, owner, biz);
  const [p] = await d.q<Party>("SELECT * FROM biz_parties WHERE id = $1 AND business_id = $2", [id, biz]);
  if (!p) return;
  const b = await getBusiness(d, owner, biz);
  if (p.account_id === b.walkin_account_id) throw new Error("WALK IN CUSTOMER can't be deleted");
  const [used] = await d.q("SELECT 1 FROM biz_docs WHERE party_id = $1 UNION ALL SELECT 1 FROM biz_payments WHERE party_id = $1 LIMIT 1", [id]);
  if (used) throw new Error("This one has invoices or payments; delete those first");
  await d.tx(async (x) => {
    await x.q("DELETE FROM biz_parties WHERE id = $1", [id]);
    const [e] = await x.q("SELECT 1 FROM entries WHERE from_account_id = $1 OR to_account_id = $1 LIMIT 1", [p.account_id]);
    if (!e) await x.q("DELETE FROM accounts WHERE id = $1 AND user_id = $2", [p.account_id, owner]);
  });
}

// ---------------------------------------------------------------- products

export type Product = { id: number; category_id: number | null; category: string | null; name: string; type: string; barcode: string | null; sale_price: number; purchase_price: number; tax_id: number | null; size: string | null; color: string | null; location: string | null; low_stock: number };

export async function products(d: Db, owner: number, biz: number) {
  await getBusiness(d, owner, biz);
  return d.q<Product>(
    `SELECT p.id, p.category_id, c.name AS category, p.name, p.type, p.barcode, p.sale_price::float8 AS sale_price, p.purchase_price::float8 AS purchase_price,
            p.tax_id, p.size, p.color, p.location, p.low_stock::float8 AS low_stock
     FROM biz_products p LEFT JOIN biz_categories c ON c.id = p.category_id WHERE p.business_id = $1 ORDER BY p.name`,
    [biz],
  );
}

export async function saveProduct(d: Db, owner: number, biz: number, id: number, f: { name: string; category_id: number | null; type: string; barcode: string; sale_price: number; purchase_price: number; tax_id: number | null; size: string; color: string; location: string; low_stock: number }) {
  await getBusiness(d, owner, biz);
  const name = t(f.name).toUpperCase();
  if (!name) throw new Error("Please enter the product name");
  if (!(f.sale_price >= 0) || !(f.purchase_price >= 0)) throw new Error("Please enter the prices");
  const [dup] = await d.q("SELECT 1 FROM biz_products WHERE business_id = $1 AND name = $2 AND id <> $3", [biz, name, id]);
  if (dup) throw new Error("A product with this name already exists");
  const v = [f.category_id || null, name, ["Stock", "Service"].includes(f.type) ? f.type : "Stock", opt(f.barcode), Math.round(f.sale_price), Math.round(f.purchase_price), f.tax_id || null, opt(f.size), opt(f.color), opt(f.location), f.low_stock >= 0 ? f.low_stock : 0];
  if (id) await d.q("UPDATE biz_products SET category_id = $1, name = $2, type = $3, barcode = $4, sale_price = $5, purchase_price = $6, tax_id = $7, size = $8, color = $9, location = $10, low_stock = $11 WHERE id = $12 AND business_id = $13", [...v, id, biz]);
  else await d.q("INSERT INTO biz_products (category_id, name, type, barcode, sale_price, purchase_price, tax_id, size, color, location, low_stock, business_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)", [...v, biz]);
}

export async function deleteProduct(d: Db, owner: number, biz: number, id: number) {
  await getBusiness(d, owner, biz);
  const [used] = await d.q("SELECT 1 FROM biz_doc_lines l JOIN biz_docs o ON o.id = l.doc_id WHERE l.product_id = $1 AND o.business_id = $2 LIMIT 1", [id, biz]);
  if (used) throw new Error("This product is on invoices; it can't be deleted");
  await d.q("DELETE FROM biz_products WHERE id = $1 AND business_id = $2", [id, biz]);
}

// ---------------------------------------------------------------- invoices (purchase, sale) and expense vouchers

export type DocInput = {
  kind: DocKind; partyId: number | null; warehouseId: number | null; date: string; note?: string;
  lines: { productId: number; qty: number; price: number }[];   // purchase / sale
  amount?: number; expenseAccountId?: number | null;              // expense voucher
  discountId?: number | null; taxId?: number | null;
  paidNow?: number; payAccountId?: number | null;                 // money paid / received straight away
};

const PREFIX: Record<DocKind, string> = { purchase: "P", sale: "S", expense: "E" };

/** Cash / bank accounts (Assets, but not RECEIVABLES) to pay from or receive into. */
export async function moneyAccounts(d: Db, owner: number) {
  return d.q<{ id: number; name: string; sub: string }>(
    `SELECT a.id, a.name, s.name AS sub FROM accounts a JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id
     WHERE a.user_id = $1 AND c.nature = 'Assets' AND c.kind = 'normal' ORDER BY a.name`,
    [owner],
  );
}

/** Expense accounts for expense vouchers. */
export async function expenseAccounts(d: Db, owner: number) {
  return d.q<{ id: number; name: string; sub: string }>(
    `SELECT a.id, a.name, s.name AS sub FROM accounts a JOIN subcategories s ON s.id = a.subcategory_id JOIN categories c ON c.id = s.category_id
     WHERE a.user_id = $1 AND c.nature = 'Expenses' ORDER BY a.name`,
    [owner],
  );
}

async function rule(d: Db, table: "biz_taxes" | "biz_discounts", biz: number, id: number | null | undefined, base: number) {
  if (!id) return 0;
  const [r] = await d.q<{ kind: string; rate: number }>(`SELECT kind, rate::float8 AS rate FROM ${table} WHERE id = $1 AND business_id = $2`, [id, biz]);
  if (!r) return 0;
  return r.kind === "percent" ? Math.round((base * r.rate) / 100) : Math.round(r.rate * 100);
}

export async function createDoc(d: Db, owner: number, biz: number, x: DocInput): Promise<number> {
  const b = await getBusiness(d, owner, biz);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.date)) throw new Error("Please Enter Date");
  let party: Party | undefined;
  if (x.partyId) [party] = await d.q<Party>("SELECT * FROM biz_parties WHERE id = $1 AND business_id = $2", [x.partyId, biz]);
  if (x.kind === "sale" && !party) [party] = await d.q<Party>("SELECT * FROM biz_parties WHERE business_id = $1 AND account_id = $2", [biz, b.walkin_account_id]);
  if (x.kind === "purchase" && !party) throw new Error("Please select the vendor");
  if (party && party.kind !== (x.kind === "sale" ? "customer" : "vendor")) throw new Error("Please select the right customer / vendor");
  let subtotal = 0;
  const lines: { productId: number; qty: number; price: number; total: number }[] = [];
  if (x.kind === "expense") {
    subtotal = Math.round(x.amount ?? 0);
    if (!(subtotal > 0)) throw new Error("Please enter the amount");
    if (!x.expenseAccountId || !(await expenseAccounts(d, owner)).some((a) => a.id === x.expenseAccountId)) throw new Error("Please select the expense account");
    if (!party && !x.payAccountId) throw new Error("Please select the vendor, or the account it was paid from");
  } else {
    if (!x.lines.length) throw new Error("Please add at least one product");
    const ids = (await d.q<IdRow>("SELECT id FROM biz_products WHERE business_id = $1", [biz])).map((r) => r.id);
    for (const l of x.lines) {
      if (!ids.includes(l.productId)) throw new Error("Please select the product");
      if (!(l.qty > 0)) throw new Error("Please enter the quantity");
      if (!(l.price >= 0)) throw new Error("Please enter the price");
      const total = Math.round(l.qty * l.price);
      lines.push({ ...l, total });
      subtotal += total;
    }
  }
  const discount = x.kind === "sale" ? Math.min(subtotal, await rule(d, "biz_discounts", biz, x.discountId, subtotal)) : 0;
  const tax = await rule(d, "biz_taxes", biz, x.taxId, subtotal - discount);
  const total = subtotal - discount + tax;
  if (!(total > 0)) throw new Error("The total must be more than zero");
  const paid = Math.round(x.paidNow ?? 0);
  if (paid < 0 || paid > total) throw new Error("The amount paid can't be more than the total");
  if (paid > 0 && !(await moneyAccounts(d, owner)).some((a) => a.id === x.payAccountId)) throw new Error("Please select the cash / bank account");

  return d.tx(async (q) => {
    const [{ n }] = await q.q<{ n: number }>("SELECT COUNT(*)::int + 1 AS n FROM biz_docs WHERE business_id = $1 AND kind = $2", [biz, x.kind]);
    const number = `${PREFIX[x.kind]}-${String(n).padStart(6, "0")}`;
    const word = x.kind === "sale" ? "Sale invoice" : x.kind === "purchase" ? "Purchase invoice" : "Expense voucher";
    const note = `${word} ${number}${x.note?.trim() ? `: ${x.note.trim()}` : ""}`;
    // the books: who owes what
    const customerAcc = party?.account_id ?? b.walkin_account_id;
    let entryId: number;
    if (x.kind === "sale") entryId = await B.addEntry(q, owner, { vtype: "R", date: x.date, amount: total, fromId: b.sales_account_id, toId: customerAcc, note });
    else if (x.kind === "purchase") entryId = await B.addEntry(q, owner, { vtype: "P", date: x.date, amount: total, fromId: party!.account_id, toId: b.purchases_account_id, note });
    else entryId = await B.addEntry(q, owner, { vtype: "P", date: x.date, amount: total, fromId: party ? party.account_id : x.payAccountId!, toId: x.expenseAccountId!, note });
    const [doc] = await q.q<IdRow>(
      `INSERT INTO biz_docs (business_id, kind, number, party_id, warehouse_id, expense_account_id, date, subtotal, discount, tax, total, note, entry_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [biz, x.kind, number, party?.id ?? null, x.warehouseId || null, x.kind === "expense" ? x.expenseAccountId : null, x.date, subtotal, discount, tax, total, opt(x.note), entryId],
    );
    for (const l of lines) await q.q("INSERT INTO biz_doc_lines (doc_id, product_id, qty, price, total) VALUES ($1, $2, $3, $4, $5)", [doc.id, l.productId, l.qty, l.price, l.total]);
    if (paid > 0 && (x.kind !== "expense" || party)) {
      await addPayment(q, owner, biz, { kind: x.kind === "sale" ? "customer" : "vendor", partyId: party?.id ?? null, docId: doc.id, date: x.date, amount: paid, accountId: x.payAccountId!, note: `Paid with ${number}` });
    }
    return doc.id;
  });
}

/** Delete an invoice / voucher: its entry goes to the Deleted Transactions Log; payments made against it stay (as money on account). */
export async function deleteDoc(d: Db, owner: number, biz: number, id: number) {
  await getBusiness(d, owner, biz);
  const [doc] = await d.q<{ entry_id: number | null }>("SELECT entry_id FROM biz_docs WHERE id = $1 AND business_id = $2", [id, biz]);
  if (!doc) return;
  await d.tx(async (q) => {
    if (doc.entry_id) await q.q("UPDATE entries SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL", [doc.entry_id]);
    await q.q("DELETE FROM biz_docs WHERE id = $1", [id]);
  });
}

export type DocRow = { id: number; kind: DocKind; number: string; party: string | null; party_id: number | null; warehouse: string | null; expense_account: string | null; date: string; subtotal: number; discount: number; tax: number; total: number; paid: number; note: string | null };

/** Invoices and vouchers. "Paid" = payments made against the invoice, plus payments made "on account",
 *  which settle that customer's / vendor's oldest invoices first (so invoice balances agree with what they owe). */
export async function docs(d: Db, owner: number, biz: number, kind: DocKind | DocKind[], r: B.Range = B.ALL) {
  await getBusiness(d, owner, biz);
  const all = await d.q<DocRow>(
    `SELECT o.id, o.kind, o.number, p.name AS party, o.party_id, w.name AS warehouse, a.name AS expense_account, to_char(o.date, 'YYYY-MM-DD') AS date,
            o.subtotal::float8 AS subtotal, o.discount::float8 AS discount, o.tax::float8 AS tax, o.total::float8 AS total,
            COALESCE((SELECT SUM(amount) FROM biz_payments y WHERE y.doc_id = o.id), 0)::float8 AS paid, o.note
     FROM biz_docs o LEFT JOIN biz_parties p ON p.id = o.party_id LEFT JOIN biz_warehouses w ON w.id = o.warehouse_id LEFT JOIN accounts a ON a.id = o.expense_account_id
     WHERE o.business_id = $1 ORDER BY o.date, o.id`,
    [biz],
  );
  const onAccount = new Map((await d.q<{ party_id: number; amount: number }>(
    "SELECT party_id, SUM(amount)::float8 AS amount FROM biz_payments WHERE business_id = $1 AND doc_id IS NULL GROUP BY party_id", [biz])).map((x) => [x.party_id, x.amount]));
  for (const o of all) {
    if (!o.party_id) { if (o.kind === "expense") o.paid = o.total; continue; } // paid straight from cash / bank
    o.paid = Math.min(o.paid, o.total);
    const left = onAccount.get(o.party_id) ?? 0;
    const use = Math.min(left, o.total - o.paid);
    if (use > 0) { o.paid += use; onAccount.set(o.party_id, left - use); }
  }
  const kinds = Array.isArray(kind) ? kind : [kind];
  const from = r.from ?? "1900-01-01", to = r.to ?? "2999-12-31";
  return all.filter((o) => kinds.includes(o.kind) && o.date >= from && o.date <= to).reverse();
}

export async function docLines(d: Db, owner: number, biz: number, docId: number) {
  await getBusiness(d, owner, biz);
  return d.q<{ product: string; qty: number; price: number; total: number }>(
    `SELECT p.name AS product, l.qty::float8 AS qty, l.price::float8 AS price, l.total::float8 AS total
     FROM biz_doc_lines l JOIN biz_products p ON p.id = l.product_id JOIN biz_docs o ON o.id = l.doc_id WHERE l.doc_id = $1 AND o.business_id = $2 ORDER BY l.id`,
    [docId, biz],
  );
}

// ---------------------------------------------------------------- payments

export async function addPayment(d: Db, owner: number, biz: number, x: { kind: PartyKind; partyId: number | null; docId?: number | null; date: string; amount: number; accountId: number; note?: string }) {
  await getBusiness(d, owner, biz);
  const [p] = x.partyId ? await d.q<Party>("SELECT * FROM biz_parties WHERE id = $1 AND business_id = $2 AND kind = $3", [x.partyId, biz, x.kind]) : [];
  if (!p) throw new Error(x.kind === "customer" ? "Please select the customer" : "Please select the vendor");
  if (!(x.amount > 0)) throw new Error("Please enter the amount");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.date)) throw new Error("Please Enter Date");
  if (!(await moneyAccounts(d, owner)).some((a) => a.id === x.accountId)) throw new Error("Please select the cash / bank account");
  let docNo = "";
  if (x.docId) {
    const [o] = await d.q<{ number: string }>("SELECT number FROM biz_docs WHERE id = $1 AND business_id = $2 AND party_id = $3", [x.docId, biz, p.id]);
    if (!o) throw new Error("That invoice is not this one's");
    docNo = o.number;
  }
  const note = `${x.kind === "customer" ? "Received from customer" : "Paid to vendor"}${docNo ? ` for ${docNo}` : ""}${x.note?.trim() ? `: ${x.note.trim()}` : ""}`;
  return d.tx(async (q) => {
    const entry = x.kind === "customer"
      ? await B.addEntry(q, owner, { vtype: "R", date: x.date, amount: Math.round(x.amount), fromId: p.account_id, toId: x.accountId, note })
      : await B.addEntry(q, owner, { vtype: "P", date: x.date, amount: Math.round(x.amount), fromId: x.accountId, toId: p.account_id, note });
    const [r] = await q.q<IdRow>("INSERT INTO biz_payments (business_id, kind, party_id, doc_id, date, amount, account_id, note, entry_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [biz, x.kind, p.id, x.docId || null, x.date, Math.round(x.amount), x.accountId, opt(x.note), entry]);
    return r.id;
  });
}

export async function deletePayment(d: Db, owner: number, biz: number, id: number) {
  await getBusiness(d, owner, biz);
  const [p] = await d.q<{ entry_id: number | null }>("SELECT entry_id FROM biz_payments WHERE id = $1 AND business_id = $2", [id, biz]);
  if (!p) return;
  await d.tx(async (q) => {
    if (p.entry_id) await q.q("UPDATE entries SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL", [p.entry_id]);
    await q.q("DELETE FROM biz_payments WHERE id = $1", [id]);
  });
}

export async function payments(d: Db, owner: number, biz: number, kind: PartyKind, r: B.Range = B.ALL) {
  await getBusiness(d, owner, biz);
  return d.q<{ id: number; party: string; doc: string | null; date: string; amount: number; account: string; note: string | null }>(
    `SELECT y.id, p.name AS party, o.number AS doc, to_char(y.date, 'YYYY-MM-DD') AS date, y.amount::float8 AS amount, a.name AS account, y.note
     FROM biz_payments y JOIN biz_parties p ON p.id = y.party_id LEFT JOIN biz_docs o ON o.id = y.doc_id JOIN accounts a ON a.id = y.account_id
     WHERE y.business_id = $1 AND y.kind = $2 AND y.date >= $3::date AND y.date <= $4::date ORDER BY y.date DESC, y.id DESC`,
    [biz, kind, r.from ?? "1900-01-01", r.to ?? "2999-12-31"],
  );
}

// ---------------------------------------------------------------- reports

/** Stock on hand per product: bought − sold, valued at the average purchase cost. */
export async function stock(d: Db, owner: number, biz: number) {
  await getBusiness(d, owner, biz);
  const rows = await d.q<{ id: number; name: string; category: string | null; type: string; low_stock: number; sale_price: number; purchase_price: number; bought: number; bought_value: number; sold: number; sold_value: number }>(
    `SELECT p.id, p.name, c.name AS category, p.type, p.low_stock::float8 AS low_stock, p.sale_price::float8 AS sale_price, p.purchase_price::float8 AS purchase_price,
            COALESCE(SUM(l.qty) FILTER (WHERE o.kind = 'purchase'), 0)::float8 AS bought, COALESCE(SUM(l.total) FILTER (WHERE o.kind = 'purchase'), 0)::float8 AS bought_value,
            COALESCE(SUM(l.qty) FILTER (WHERE o.kind = 'sale'), 0)::float8 AS sold, COALESCE(SUM(l.total) FILTER (WHERE o.kind = 'sale'), 0)::float8 AS sold_value
     FROM biz_products p LEFT JOIN biz_categories c ON c.id = p.category_id
     LEFT JOIN biz_doc_lines l ON l.product_id = p.id LEFT JOIN biz_docs o ON o.id = l.doc_id
     WHERE p.business_id = $1 GROUP BY p.id, c.name ORDER BY p.name`,
    [biz],
  );
  return rows.map((r) => {
    const cost = r.bought > 0 ? r.bought_value / r.bought : r.purchase_price;
    const onHand = Math.round((r.bought - r.sold) * 1000) / 1000;
    return { ...r, avg_cost: Math.round(cost), on_hand: onHand, value: Math.round(onHand * cost), low: r.type === "Stock" && onHand <= r.low_stock };
  });
}

/** Product-wise profit for a period: sales minus cost (quantity × average purchase cost). */
export async function productProfit(d: Db, owner: number, biz: number, r: B.Range) {
  const st = new Map((await stock(d, owner, biz)).map((s) => [s.id, s.avg_cost]));
  const rows = await d.q<{ id: number; name: string; qty: number; sales: number }>(
    `SELECT p.id, p.name, SUM(l.qty)::float8 AS qty, SUM(l.total)::float8 AS sales FROM biz_doc_lines l JOIN biz_docs o ON o.id = l.doc_id JOIN biz_products p ON p.id = l.product_id
     WHERE o.business_id = $1 AND o.kind = 'sale' AND o.date >= $2::date AND o.date <= $3::date GROUP BY p.id ORDER BY p.name`,
    [biz, r.from ?? "1900-01-01", r.to ?? "2999-12-31"],
  );
  return rows.map((x) => { const cost = Math.round(x.qty * (st.get(x.id) ?? 0)); return { ...x, cost, profit: x.sales - cost }; });
}

/** Product sales (or purchases) by customer (vendor) for a period. */
export async function productByParty(d: Db, owner: number, biz: number, kind: "sale" | "purchase", r: B.Range) {
  await getBusiness(d, owner, biz);
  return d.q<{ party: string; product: string; qty: number; amount: number }>(
    `SELECT COALESCE(pa.name, 'WALK IN CUSTOMER') AS party, p.name AS product, SUM(l.qty)::float8 AS qty, SUM(l.total)::float8 AS amount
     FROM biz_doc_lines l JOIN biz_docs o ON o.id = l.doc_id JOIN biz_products p ON p.id = l.product_id LEFT JOIN biz_parties pa ON pa.id = o.party_id
     WHERE o.business_id = $1 AND o.kind = $2 AND o.date >= $3::date AND o.date <= $4::date GROUP BY 1, 2 ORDER BY 1, 2`,
    [biz, kind, r.from ?? "1900-01-01", r.to ?? "2999-12-31"],
  );
}

/** Customer / vendor balances: invoiced, paid and what is still owed (customers owe you; you owe vendors). */
export async function partyBalances(d: Db, owner: number, biz: number, kind: PartyKind) {
  await getBusiness(d, owner, biz);
  return d.q<{ id: number; name: string; contact: string | null; account_id: number; invoiced: number; paid: number; balance: number }>(
    `SELECT p.id, p.name, p.contact, p.account_id,
            COALESCE((SELECT SUM(total) FROM biz_docs o WHERE o.party_id = p.id), 0)::float8 AS invoiced,
            COALESCE((SELECT SUM(amount) FROM biz_payments y WHERE y.party_id = p.id), 0)::float8 AS paid,
            (COALESCE((SELECT SUM(total) FROM biz_docs o WHERE o.party_id = p.id), 0) - COALESCE((SELECT SUM(amount) FROM biz_payments y WHERE y.party_id = p.id), 0))::float8 AS balance
     FROM biz_parties p WHERE p.business_id = $1 AND p.kind = $2 ORDER BY p.name`,
    [biz, kind],
  );
}

/** Aging: what each customer (vendor) still owes, by how old the invoice is. Payments settle the oldest invoices first. */
export async function aging(d: Db, owner: number, biz: number, kind: PartyKind, on = today()) {
  const bal = await partyBalances(d, owner, biz, kind);
  const out = [];
  for (const p of bal) {
    const inv = await d.q<{ date: string; total: number }>("SELECT to_char(date, 'YYYY-MM-DD') AS date, total::float8 AS total FROM biz_docs WHERE party_id = $1 ORDER BY date, id", [p.id]);
    let paid = p.paid;
    const b = { current: 0, d31: 0, d61: 0, d90: 0 };
    for (const i of inv) {
      const use = Math.min(paid, i.total);
      paid -= use;
      const left = i.total - use;
      if (!left) continue;
      const days = Math.floor((Date.parse(on) - Date.parse(i.date)) / 86400000);
      if (days <= 30) b.current += left; else if (days <= 60) b.d31 += left; else if (days <= 90) b.d61 += left; else b.d90 += left;
    }
    const total = b.current + b.d31 + b.d61 + b.d90;
    if (total || p.balance) out.push({ id: p.id, name: p.name, account_id: p.account_id, ...b, total, advance: Math.max(0, -p.balance) });
  }
  return out;
}

/** The business dashboard: totals for a period, sales by month and the best-selling products. */
export async function bizDashboard(d: Db, owner: number, biz: number, r: B.Range) {
  await getBusiness(d, owner, biz);
  const [s] = await d.q<{ sales: number; purchases: number; expenses: number; sale_count: number }>(
    `SELECT COALESCE(SUM(total) FILTER (WHERE kind = 'sale'), 0)::float8 AS sales, COALESCE(SUM(total) FILTER (WHERE kind = 'purchase'), 0)::float8 AS purchases,
            COALESCE(SUM(total) FILTER (WHERE kind = 'expense'), 0)::float8 AS expenses, COUNT(*) FILTER (WHERE kind = 'sale')::int AS sale_count
     FROM biz_docs WHERE business_id = $1 AND date >= $2::date AND date <= $3::date`,
    [biz, r.from ?? "1900-01-01", r.to ?? "2999-12-31"],
  );
  const recv = (await partyBalances(d, owner, biz, "customer")).reduce((a, x) => a + Math.max(0, x.balance), 0);
  const pay = (await partyBalances(d, owner, biz, "vendor")).reduce((a, x) => a + Math.max(0, x.balance), 0);
  const st = await stock(d, owner, biz);
  const months = await d.q<{ m: string; sales: number; purchases: number }>(
    `SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS m, COALESCE(SUM(total) FILTER (WHERE kind = 'sale'), 0)::float8 AS sales,
            COALESCE(SUM(total) FILTER (WHERE kind IN ('purchase', 'expense')), 0)::float8 AS purchases
     FROM biz_docs WHERE business_id = $1 AND date >= (date_trunc('month', CURRENT_DATE) - interval '5 months') GROUP BY 1 ORDER BY 1`,
    [biz],
  );
  const top = (await productProfit(d, owner, biz, r)).sort((a, b) => b.sales - a.sales).slice(0, 5);
  return { ...s, receivable: recv, payable: pay, stockValue: st.reduce((a, x) => a + Math.max(0, x.value), 0), lowCount: st.filter((x) => x.low).length, months, top };
}
