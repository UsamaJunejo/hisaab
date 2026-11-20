import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/biz-session";
import * as Z from "@/lib/business";
import { pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { BIZ_MENU } from "@/components/biz/menu";
import { BizPage } from "@/components/biz/biz-page";
import { PrintButton } from "@/components/print-button";
import { Printer } from "lucide-react";

export const metadata = { title: "Business Report" };

type Col = { h: string; r?: boolean };
type Table = { cols: Col[]; rows: React.ReactNode[][]; foot?: React.ReactNode[]; note?: string };

/** Every Business Module report, as one table (with the period from the date filter where it applies). */
export default async function BizReport({ params }: { params: Promise<{ report: string }> }) {
  const key = (await params).report;
  const title = BIZ_MENU.flatMap((g) => g.items).find(([h]) => h === `/business/reports/${key}`)?.[1];
  if (!title) notFound();
  const { u, d, b, list } = await requireBusiness();
  const r = await pageRange("month");
  const m = (v: number) => money(v);
  const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
  const ledger = (id: number, name: string) => <Link href={`/account/${id}`} className="font-medium text-blue underline">{name}</Link>;
  let t: Table;
  let dated = true;
  switch (key) {
    case "stock-on-hand": case "stock-value": case "low-inventory": {
      dated = false;
      let st = await Z.stock(d, u.id, b.id);
      st = st.filter((x) => x.type === "Stock" && (key !== "low-inventory" || x.low));
      const withValue = key === "stock-value";
      t = { cols: [{ h: "S/No" }, { h: "Product" }, { h: "Category" }, { h: "Purchased", r: true }, { h: "Sold", r: true }, { h: "On Hand", r: true }, ...(withValue ? [{ h: "Avg Cost", r: true }, { h: "Value", r: true }] : [{ h: "Low At", r: true }])],
        rows: st.map((x, i) => [`${i + 1}.`, <span key="n" className={x.low ? "font-semibold text-red" : ""}>{x.name}</span>, x.category, x.bought, x.sold, x.on_hand, ...(withValue ? [m(x.avg_cost), m(x.value)] : [x.low_stock])]),
        foot: withValue ? ["", "", "", "", "", "TOTAL:", "", m(sum(st.map((x) => Math.max(0, x.value))))] : undefined,
        note: key === "low-inventory" ? "Products at or below their low-stock level (set it in Product Entry)." : undefined };
      break;
    }
    case "sale-invoice": case "purchase-invoice": case "walk-in": {
      let rows = await Z.docs(d, u.id, b.id, key === "purchase-invoice" ? ["purchase", "expense"] : "sale", r);
      if (key === "walk-in") rows = rows.filter((x) => x.party === "WALK IN CUSTOMER");
      t = { cols: [{ h: "S/No" }, { h: "Invoice #" }, { h: "Date" }, { h: key === "purchase-invoice" ? "Vendor" : "Customer" }, { h: "Total", r: true }, { h: "Discount", r: true }, { h: "Tax", r: true }, { h: "Grand Total", r: true }, { h: "Paid", r: true }, { h: "Balance", r: true }],
        rows: rows.map((x, i) => [`${i + 1}.`, <Link key="n" href={`/business/doc/${x.id}`} className="text-blue underline">{x.number}</Link>, x.date, x.party ?? (x.kind === "sale" ? "WALK IN CUSTOMER" : x.expense_account), m(x.subtotal), m(x.discount), m(x.tax), m(x.total), m(x.paid), m(x.total - x.paid)]),
        foot: ["", "", "", "TOTAL:", m(sum(rows.map((x) => x.subtotal))), m(sum(rows.map((x) => x.discount))), m(sum(rows.map((x) => x.tax))), m(sum(rows.map((x) => x.total))), m(sum(rows.map((x) => x.paid))), m(sum(rows.map((x) => x.total - x.paid)))] };
      break;
    }
    case "product-sale-customer": case "product-purchase": {
      const rows = await Z.productByParty(d, u.id, b.id, key === "product-purchase" ? "purchase" : "sale", r);
      t = { cols: [{ h: "S/No" }, { h: key === "product-purchase" ? "Vendor" : "Customer" }, { h: "Product" }, { h: "Quantity", r: true }, { h: "Amount", r: true }],
        rows: rows.map((x, i) => [`${i + 1}.`, x.party, x.product, x.qty, m(x.amount)]), foot: ["", "", "TOTAL:", sum(rows.map((x) => x.qty)), m(sum(rows.map((x) => x.amount)))] };
      break;
    }
    case "receive-money": case "vendor-payment": {
      const rows = await Z.payments(d, u.id, b.id, key === "receive-money" ? "customer" : "vendor", r);
      t = { cols: [{ h: "S/No" }, { h: "Date" }, { h: key === "receive-money" ? "Customer" : "Vendor" }, { h: "Invoice" }, { h: key === "receive-money" ? "Received In" : "Paid From" }, { h: "Note" }, { h: "Amount", r: true }],
        rows: rows.map((x, i) => [`${i + 1}.`, x.date, x.party, x.doc, x.account, x.note, m(x.amount)]), foot: ["", "", "", "", "", "TOTAL:", m(sum(rows.map((x) => x.amount)))] };
      break;
    }
    case "customer-balance": case "vendor-balance": case "customer-ledger": case "vendor-ledger": {
      dated = false;
      const kind = key.startsWith("customer") ? "customer" : "vendor";
      const rows = await Z.partyBalances(d, u.id, b.id, kind);
      t = { cols: [{ h: "S/No" }, { h: kind === "customer" ? "Customer" : "Vendor" }, { h: "Contact" }, { h: "Invoiced", r: true }, { h: kind === "customer" ? "Received" : "Paid", r: true }, { h: kind === "customer" ? "They Owe" : "You Owe", r: true }],
        rows: rows.map((x, i) => [`${i + 1}.`, ledger(x.account_id, x.name), x.contact, m(x.invoiced), m(x.paid), m(x.balance)]),
        foot: ["", "TOTAL:", "", m(sum(rows.map((x) => x.invoiced))), m(sum(rows.map((x) => x.paid))), m(sum(rows.map((x) => x.balance)))],
        note: key.endsWith("ledger") ? "Tap a name to open its full ledger (every invoice and payment, with a running balance)." : undefined };
      break;
    }
    case "customer-aging": case "vendor-aging": case "aged-receivable": case "aged-payable": {
      dated = false;
      const kind = key === "customer-aging" || key === "aged-receivable" ? "customer" : "vendor";
      const rows = await Z.aging(d, u.id, b.id, kind);
      t = { cols: [{ h: "S/No" }, { h: kind === "customer" ? "Customer" : "Vendor" }, { h: "0 - 30 Days", r: true }, { h: "31 - 60 Days", r: true }, { h: "61 - 90 Days", r: true }, { h: "Over 90 Days", r: true }, { h: "Total", r: true }],
        rows: rows.map((x, i) => [`${i + 1}.`, ledger(x.account_id, x.name), m(x.current), m(x.d31), m(x.d61), m(x.d90), m(x.total)]),
        foot: ["", "TOTAL:", m(sum(rows.map((x) => x.current))), m(sum(rows.map((x) => x.d31))), m(sum(rows.map((x) => x.d61))), m(sum(rows.map((x) => x.d90))), m(sum(rows.map((x) => x.total)))],
        note: "What is still owed, by how old each invoice is (as of today). Payments settle the oldest invoices first." };
      break;
    }
    case "product-profit": {
      const rows = await Z.productProfit(d, u.id, b.id, r);
      t = { cols: [{ h: "S/No" }, { h: "Product" }, { h: "Qty Sold", r: true }, { h: "Sales", r: true }, { h: "Cost", r: true }, { h: "Profit", r: true }],
        rows: rows.map((x, i) => [`${i + 1}.`, x.name, x.qty, m(x.sales), m(x.cost), <span key="p" className={x.profit < 0 ? "text-red" : "text-green"}>{m(x.profit)}</span>]),
        foot: ["", "TOTAL:", sum(rows.map((x) => x.qty)), m(sum(rows.map((x) => x.sales))), m(sum(rows.map((x) => x.cost))), m(sum(rows.map((x) => x.profit)))],
        note: "Cost = quantity sold × the average price you paid for the product." };
      break;
    }
    default: notFound();
  }
  return (
    <BizPage title={title} u={u} b={b} list={list} filter={dated ? `/business/reports/${key}` : undefined}>
      <div className="card overflow-x-auto p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold tracking-wide">{title.toUpperCase()}{dated && <span className="font-normal text-muted"> · {r.from ? longDate(r.from) : "FIRST ENTRY"} TO {longDate(r.to ?? today())}</span>}</h2>
          <span className="no-print"><PrintButton label="Print" icon={<Printer className="h-5 w-5" />} /></span>
        </div>
        <table className="tbl">
          <thead><tr>{t.cols.map((c) => <th key={c.h} className={c.r ? "r" : ""}>{c.h}</th>)}</tr></thead>
          <tbody>
            {t.rows.length === 0 && <tr><td colSpan={t.cols.length} className="py-6 text-center text-muted">Nothing to show{dated ? " in this period" : ""}.</td></tr>}
            {t.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className={t.cols[j]?.r ? "r num" : ""}>{c}</td>)}</tr>)}
          </tbody>
          {t.foot && t.rows.length > 0 && <tfoot><tr>{t.foot.map((c, j) => <td key={j} className={t.cols[j]?.r ? "r num" : "r"}>{c}</td>)}</tr></tfoot>}
        </table>
        {t.note && <p className="mt-2 text-xs text-muted">{t.note}</p>}
      </div>
    </BizPage>
  );
}
