import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/biz-session";
import { docLines, docs } from "@/lib/business";
import { money } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
import { Printer } from "lucide-react";
import { BizPage } from "@/components/biz/biz-page";

export const metadata = { title: "Invoice" };

/** One invoice / voucher, ready to print. */
export default async function Doc({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const { u, d, b, list } = await requireBusiness();
  const doc = (await docs(d, u.id, b.id, ["purchase", "sale", "expense"])).find((x) => x.id === id);
  if (!doc) notFound();
  const lines = await docLines(d, u.id, b.id, id);
  const pays = await d.q<{ date: string; amount: number; account: string }>("SELECT to_char(y.date, 'YYYY-MM-DD') AS date, y.amount::float8 AS amount, a.name AS account FROM biz_payments y JOIN accounts a ON a.id = y.account_id WHERE y.doc_id = $1 ORDER BY y.date", [id]);
  const title = doc.kind === "sale" ? "SALE INVOICE" : doc.kind === "purchase" ? "PURCHASE INVOICE" : "EXPENSE VOUCHER";
  return (
    <BizPage title={title} u={u} b={b} list={list}>
      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div><p className="text-xl font-bold">{b.name}</p><p className="text-sm text-muted">{[b.address, b.phone, b.email].filter(Boolean).join(" · ")}</p>{b.tax_no && <p className="text-sm text-muted">TAX Registration # {b.tax_no}</p>}</div>
          <div className="text-right text-sm"><p className="text-lg font-bold">{title}</p><p>No. <b className="num">{doc.number}</b></p><p>Date: <b className="num">{doc.date}</b></p>
            <div className="no-print mt-2"><PrintButton label="Print" icon={<Printer className="h-5 w-5" />} /></div></div>
        </div>
        <p className="mb-3 text-sm"><b>{doc.kind === "sale" ? "Customer" : "Vendor"}:</b> {doc.party ?? (doc.kind === "sale" ? "WALK IN CUSTOMER" : "—")}{doc.warehouse && <> · <b>Warehouse:</b> {doc.warehouse}</>}{doc.expense_account && <> · <b>Expense:</b> {doc.expense_account}</>}</p>
        {lines.length > 0 && (
          <table className="tbl mb-3"><thead><tr><th>S/No</th><th>Product</th><th className="r">Unit Price</th><th className="r">Quantity</th><th className="r">Total</th></tr></thead>
            <tbody>{lines.map((l, i) => <tr key={i}><td>{i + 1}.</td><td>{l.product}</td><td className="r num">{money(l.price)}</td><td className="r num">{l.qty}</td><td className="r num">{money(l.total)}</td></tr>)}</tbody></table>
        )}
        <dl className="num ml-auto grid max-w-xs grid-cols-2 gap-1 text-sm">
          <dt>Total</dt><dd className="text-right">{money(doc.subtotal)}</dd>
          {doc.discount > 0 && <><dt>Discount</dt><dd className="text-right">− {money(doc.discount)}</dd></>}
          {doc.tax > 0 && <><dt>Tax</dt><dd className="text-right">+ {money(doc.tax)}</dd></>}
          <dt className="font-bold">Grand Total</dt><dd className="text-right font-bold">{u.currency} {money(doc.total)}</dd>
          <dt>Paid</dt><dd className="text-right">{money(doc.paid)}</dd>
          <dt className="font-bold">Balance</dt><dd className="text-right font-bold">{money(doc.total - doc.paid)}</dd>
        </dl>
        {pays.length > 0 && <p className="mt-3 text-xs text-muted">Payments: {pays.map((p) => `${p.date} ${money(p.amount)} (${p.account})`).join(", ")}</p>}
        {doc.note && <p className="mt-3 text-sm"><b>Note:</b> {doc.note}</p>}
      </div>
      <p className="no-print mt-3 text-sm"><Link href={`/business/${doc.kind}`} className="text-blue underline">Back to {doc.kind === "sale" ? "Sale Invoice" : doc.kind === "purchase" ? "Direct Purchase" : "Expense Vouchers"}</Link></p>
    </BizPage>
  );
}
