import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireBusiness } from "@/lib/biz-session";
import { docs, expenseAccounts, listRows, moneyAccounts, parties, products, type DocKind } from "@/lib/business";
import { pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { BizPage } from "./biz-page";
import { DocForm } from "./doc-form";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteDocAction } from "@/app/actions/business";

const TITLE: Record<DocKind, string> = { purchase: "Direct Purchase", sale: "Sale Invoice", expense: "Expense Vouchers" };

/** DIRECT PURCHASE, SALE INVOICE and EXPENSE VOUCHERS: the form, then this period's list. */
export async function DocPage({ kind }: { kind: DocKind }) {
  const { u, d, b, list } = await requireBusiness();
  const r = await pageRange("month");
  const [ps, prods, wh, taxes, discs, mon, exp, rows] = await Promise.all([
    parties(d, u.id, b.id, kind === "sale" ? "customer" : "vendor"), products(d, u.id, b.id), listRows(d, u.id, b.id, "warehouses"),
    listRows(d, u.id, b.id, "taxes"), listRows(d, u.id, b.id, "discounts"), moneyAccounts(d, u.id), expenseAccounts(d, u.id), docs(d, u.id, b.id, kind, r),
  ]);
  const rule = (x: Record<string, string | number | null>) => ({ id: x.id as number, name: String(x.name), kind: String(x.kind), rate: Number(x.rate) });
  const total = rows.reduce((s, x) => s + x.total, 0);
  const back = `/business/${kind}`;
  return (
    <BizPage title={TITLE[kind]} u={u} b={b} list={list} filter={back}>
      <DocForm kind={kind} biz={b.id} today={today()} currency={u.currency}
        parties={ps.filter((x) => x.account_id !== b.walkin_account_id).map((x) => ({ id: x.id, name: x.name }))} products={prods.map((x) => ({ id: x.id, name: x.name, sale_price: x.sale_price, purchase_price: x.purchase_price, type: x.type }))}
        warehouses={wh.map((x) => ({ id: x.id as number, name: String(x.name) }))} taxes={taxes.map(rule)} discounts={discs.map(rule)} money={mon} expenses={exp} />
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">{TITLE[kind].toUpperCase()} · {r.from ? longDate(r.from) : "FIRST ENTRY"} TO {longDate(r.to ?? today())}</h2>
        <table className="tbl">
          <thead><tr><th>S/No</th><th>Invoice #</th><th>Date</th><th>{kind === "sale" ? "Customer" : "Vendor"}</th>{kind === "expense" && <th>Expense Account</th>}<th className="r">Total</th><th className="r">Paid</th><th className="r">Balance</th><th className="c">View</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted">Nothing in this period. Use the date filter to see earlier ones.</td></tr>}
            {rows.map((x, i) => (
              <tr key={x.id} data-search={`${x.number} ${x.party ?? ""} ${x.note ?? ""}`}>
                <td>{i + 1}.</td><td className="num">{x.number}</td><td className="num whitespace-nowrap">{x.date}</td><td>{x.party ?? (kind === "sale" ? "WALK IN CUSTOMER" : "—")}</td>
                {kind === "expense" && <td>{x.expense_account}</td>}
                <td className="r num">{money(x.total)}</td><td className="r num">{money(x.paid)}</td><td className="r num">{money(x.total - x.paid)}</td>
                <td className="c"><Link href={`/business/doc/${x.id}`} className="text-blue underline">View</Link></td>
                <td className="c"><ConfirmForm action={deleteDocAction} fields={{ biz: b.id, id: x.id, back }} message={`Delete ${x.number}?`} className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && <tfoot><tr><td colSpan={kind === "expense" ? 5 : 4} className="r">Grand Total:</td><td className="r num">{money(total)}</td><td colSpan={4} /></tr></tfoot>}
        </table>
      </div>
    </BizPage>
  );
}
