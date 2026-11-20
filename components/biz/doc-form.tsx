"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createDocAction } from "@/app/actions/business";

type Opt = { id: number; name: string };
type Rule = { id: number; name: string; kind: string; rate: number };
type Prod = { id: number; name: string; sale_price: number; purchase_price: number; type: string };

const fmt = (p: number) => (p / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ruleAmount = (r: Rule | undefined, base: number) => (!r ? 0 : r.kind === "percent" ? Math.round((base * r.rate) / 100) : Math.round(r.rate * 100));

/** DIRECT PURCHASE / SALE INVOICE / EXPENSE VOUCHER form. Totals are worked out as you type (the server works them out again). */
export function DocForm(p: {
  kind: "purchase" | "sale" | "expense"; biz: number; today: string; currency: string;
  parties: Opt[]; products: Prod[]; warehouses: Opt[]; taxes: Rule[]; discounts: Rule[]; money: (Opt & { sub: string })[]; expenses: (Opt & { sub: string })[];
}) {
  const [lines, setLines] = useState<{ productId: string; qty: string; price: string }[]>([{ productId: "", qty: "1", price: "" }]);
  const [taxId, setTax] = useState("");
  const [discId, setDisc] = useState("");
  const [amount, setAmount] = useState("");
  const priceOf = (id: string) => { const x = p.products.find((r) => String(r.id) === id); return x ? ((p.kind === "sale" ? x.sale_price : x.purchase_price) / 100).toFixed(2) : ""; };
  const sub = useMemo(() => p.kind === "expense" ? Math.round((Number(amount) || 0) * 100) : lines.reduce((s, l) => s + Math.round((Number(l.qty) || 0) * Math.round((Number(l.price) || 0) * 100)), 0), [lines, amount, p.kind]);
  const disc = p.kind === "sale" ? Math.min(sub, ruleAmount(p.discounts.find((r) => String(r.id) === discId), sub)) : 0;
  const tax = ruleAmount(p.taxes.find((r) => String(r.id) === taxId), sub - disc);
  const total = sub - disc + tax;
  const set = (i: number, k: "productId" | "qty" | "price", v: string) => setLines((ls) => ls.map((l, n) => (n !== i ? l : k === "productId" ? { ...l, productId: v, price: priceOf(v) } : { ...l, [k]: v })));
  const partyWord = p.kind === "sale" ? "Customer" : "Vendor";
  return (
    <form action={createDocAction} className="card mb-4 space-y-3 p-4">
      <input type="hidden" name="biz" value={p.biz} /><input type="hidden" name="kind" value={p.kind} />
      <input type="hidden" name="lines" value={JSON.stringify(lines.filter((l) => l.productId))} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold">{p.kind === "sale" ? "Customer" : "Select Vendor"}
          <select name="party" required={p.kind === "purchase"} defaultValue="" className="input mt-1">
            <option value="">{p.kind === "sale" ? "WALK IN CUSTOMER" : p.kind === "expense" ? "No vendor (paid now)" : "Select"}</option>
            {p.parties.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        {p.kind !== "expense"
          ? <label className="text-sm font-semibold">Warehouse<select name="warehouse" className="input mt-1">{p.warehouses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          : <label className="text-sm font-semibold">Expense Account<select name="expense_account" required defaultValue="" className="input mt-1"><option value="">Select</option>{p.expenses.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.sub})</option>)}</select></label>}
        <label className="text-sm font-semibold">Entry Date<input name="date" type="date" required defaultValue={p.today} className="input mt-1" /></label>
      </div>
      {p.kind === "expense" ? (
        <label className="block text-sm font-semibold">Amount ({p.currency})<input name="amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter Amount here." className="input mt-1" /></label>
      ) : (
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>S/No</th><th>Product Name</th><th className="r">Unit Price</th><th className="r">Quantity</th><th className="r">Total</th><th /></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td>{i + 1}.</td>
                  <td className="min-w-48"><select aria-label="Product" value={l.productId} onChange={(e) => set(i, "productId", e.target.value)} className="input"><option value="">Select product</option>{p.products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                  <td className="w-32"><input aria-label="Unit price" inputMode="decimal" value={l.price} onChange={(e) => set(i, "price", e.target.value)} className="input text-right" /></td>
                  <td className="w-28"><input aria-label="Quantity" inputMode="decimal" value={l.qty} onChange={(e) => set(i, "qty", e.target.value)} className="input text-right" /></td>
                  <td className="r num">{fmt(Math.round((Number(l.qty) || 0) * Math.round((Number(l.price) || 0) * 100)))}</td>
                  <td className="c">{lines.length > 1 && <button type="button" aria-label="Remove line" onClick={() => setLines((ls) => ls.filter((_, n) => n !== i))} className="text-red"><Trash2 className="h-4 w-4" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => setLines((ls) => [...ls, { productId: "", qty: "1", price: "" }])} className="btn btn-ghost mt-2 h-9 min-h-0"><Plus className="h-4 w-4" />Add product</button>
          {p.products.length === 0 && <p className="mt-2 text-sm text-red">Add products first in Product Entry.</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {p.kind === "sale" && <label className="text-sm font-semibold">Discount<select name="discount" value={discId} onChange={(e) => setDisc(e.target.value)} className="input mt-1"><option value="">No discount</option>{p.discounts.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.kind === "percent" ? `${x.rate}%` : fmt(x.rate * 100)})</option>)}</select></label>}
        <label className="text-sm font-semibold">Tax<select name="tax" value={taxId} onChange={(e) => setTax(e.target.value)} className="input mt-1"><option value="">No tax</option>{p.taxes.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.kind === "percent" ? `${x.rate}%` : fmt(x.rate * 100)})</option>)}</select></label>
        <label className="text-sm font-semibold">Note<input name="note" placeholder="Enter Note Here" className="input mt-1" /></label>
      </div>
      <dl className="num ml-auto grid max-w-sm grid-cols-2 gap-1 rounded-lg bg-page p-3 text-sm">
        <dt>Total</dt><dd className="text-right">{fmt(sub)}</dd>
        {p.kind === "sale" && <><dt>Discount</dt><dd className="text-right">− {fmt(disc)}</dd></>}
        <dt>Tax</dt><dd className="text-right">+ {fmt(tax)}</dd>
        <dt className="font-bold">Grand Total</dt><dd className="text-right font-bold">{p.currency} {fmt(total)}</dd>
      </dl>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold">{p.kind === "sale" ? "Received now" : "Paid now"} ({p.currency})<input name="paid" inputMode="decimal" placeholder={p.kind === "expense" ? "Leave empty when it goes on the vendor's account" : "0.00"} className="input mt-1" /></label>
        <label className="text-sm font-semibold">{p.kind === "sale" ? "Payment To" : "Payment From"}<select name="pay_account" className="input mt-1"><option value="">Select cash / bank</option>{p.money.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.sub})</option>)}</select></label>
        <div className="flex items-end justify-end"><button className="btn btn-green w-full sm:w-auto">{p.kind === "sale" ? "Save Sale Invoice" : p.kind === "purchase" ? "Generate Direct Purchase" : "Generate Voucher"}</button></div>
      </div>
      <p className="text-xs text-muted">{p.kind === "expense" ? "With no vendor, the expense is paid straight from the cash / bank account you choose." : `Anything not paid now stays on the ${partyWord.toLowerCase()}'s account until you record a payment.`}</p>
    </form>
  );
}
