import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireBusiness } from "@/lib/biz-session";
import { docs, moneyAccounts, partyBalances, payments } from "@/lib/business";
import { pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { BizPage, BizFields } from "@/components/biz/biz-page";
import { ConfirmForm } from "@/components/confirm-form";
import { addPaymentAction, deletePaymentAction } from "@/app/actions/business";

export const metadata = { title: "Payments" };

/** VENDOR PAYMENTS (money you pay vendors) and CUSTOMERS PAYMENTS (money customers pay you). */
export default async function Payments({ params }: { params: Promise<{ kind: string }> }) {
  const kind = (await params).kind;
  if (kind !== "vendor" && kind !== "customer") notFound();
  const { u, d, b, list } = await requireBusiness();
  const r = await pageRange("month");
  const back = `/business/payments/${kind}`;
  const [bal, mon, open, rows] = await Promise.all([partyBalances(d, u.id, b.id, kind), moneyAccounts(d, u.id), docs(d, u.id, b.id, kind === "vendor" ? ["purchase", "expense"] : ["sale"]), payments(d, u.id, b.id, kind, r)]);
  const unpaid = open.filter((x) => x.party_id && x.total > x.paid);
  const title = kind === "vendor" ? "Vendor Payments" : "Customers Payments";
  const total = rows.reduce((s, x) => s + x.amount, 0);
  return (
    <BizPage title={title} u={u} b={b} list={list} filter={back}>
      <form action={addPaymentAction} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <BizFields biz={b.id} back={back} /><input type="hidden" name="kind" value={kind} />
        <label className="text-sm font-semibold">{kind === "vendor" ? "Select Vendor" : "Customer"}<select name="party" required defaultValue="" className="input mt-1"><option value="">Select</option>{bal.map((x) => <option key={x.id} value={x.id}>{x.name} ({kind === "vendor" ? "you owe" : "owes"} {money(x.balance)})</option>)}</select></label>
        <label className="text-sm font-semibold">Invoice<select name="doc" defaultValue="" className="input mt-1"><option value="">Any (on account)</option>{unpaid.map((x) => <option key={x.id} value={x.id}>{x.number} · {x.party} · {money(x.total - x.paid)}</option>)}</select></label>
        <label className="text-sm font-semibold">{kind === "vendor" ? "Payment From" : "Payment To"}<select name="account" required defaultValue="" className="input mt-1"><option value="">Select cash / bank</option>{mon.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.sub})</option>)}</select></label>
        <label className="text-sm font-semibold">Entry Date<input name="date" type="date" required defaultValue={today()} className="input mt-1" /></label>
        <label className="text-sm font-semibold">Amount ({u.currency})<input name="amount" required inputMode="decimal" placeholder="Enter Amount here." className="input mt-1" /></label>
        <label className="text-sm font-semibold">Note<input name="note" placeholder="Enter Note Here" className="input mt-1" /></label>
        <div className="flex justify-end gap-2 sm:col-span-3"><button type="reset" className="btn btn-ghost">Clear</button><button className="btn btn-green">Save</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">{kind === "vendor" ? "PAYMENT DETAILS" : "SALE PAYMENT DETAILS"} · {r.from ? longDate(r.from) : "FIRST ENTRY"} TO {longDate(r.to ?? today())}</h2>
        <table className="tbl">
          <thead><tr><th>S/No</th><th>Date</th><th>{kind === "vendor" ? "Vendor" : "Customer"}</th><th>Invoice</th><th>{kind === "vendor" ? "Payment From" : "Payment To"}</th><th>Note</th><th className="r">Amount</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted">No payments in this period.</td></tr>}
            {rows.map((x, i) => (
              <tr key={x.id} data-search={`${x.party} ${x.doc ?? ""} ${x.note ?? ""}`}>
                <td>{i + 1}.</td><td className="num whitespace-nowrap">{x.date}</td><td>{x.party}</td><td className="num">{x.doc}</td><td>{x.account}</td><td>{x.note}</td><td className="r num">{money(x.amount)}</td>
                <td className="c"><ConfirmForm action={deletePaymentAction} fields={{ biz: b.id, kind, id: x.id }} message="Delete this payment?" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && <tfoot><tr><td colSpan={6} className="r">TOTAL:</td><td className="r num">{money(total)}</td><td /></tr></tfoot>}
        </table>
      </div>
    </BizPage>
  );
}
