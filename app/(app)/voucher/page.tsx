import Link from "next/link";
import { FileDown, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { ratesToday } from "@/lib/fx";
import { addMonths, dotDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { VoucherForm, type VoucherInit } from "@/components/voucher-form";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteVoucher } from "@/app/actions/voucher";

export const metadata = { title: "Voucher" };

export default async function Voucher({ searchParams }: { searchParams: Promise<{ t?: string; edit?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const sp = await searchParams;
  const editing = sp.edit ? await B.getEntry(d, u.id, Number(sp.edit)) : undefined;
  const vtype = (editing?.vtype ?? (sp.t === "R" ? "R" : "P")) as "P" | "R";
  const accounts = await B.voucherAccounts(d, u.id);
  let rates: Record<string, number> = {};
  try { rates = Object.fromEntries(await ratesToday(d, u.currency)); } catch { /* offline: type the rate */ }
  const files = editing ? await d.q<{ id: number; name: string; mime: string }>("SELECT id, name, mime FROM attachments WHERE entry_id = $1 ORDER BY id", [editing.id]) : [];
  const init: VoucherInit = editing && editing.user_id === u.id
    ? { id: editing.id, vtype, date: editing.date, amount: (editing.amount / 100).toFixed(2), fromId: editing.from_account_id, toId: editing.to_account_id, note: editing.note ?? "", highlight: editing.highlight,
        currency: editing.currency, foreign: editing.foreign_amount ? (editing.foreign_amount / 100).toString() : "", rate: editing.rate ? String(editing.rate) : "", files }
    : { vtype, date: today() };
  const history = await B.vouchers(d, u.id, vtype, { from: addMonths(today(), -1), to: today() });
  const tab = (t: "P" | "R", label: string) => (
    <Link href={`/voucher?t=${t}`} aria-current={vtype === t ? "page" : undefined}
      className={`btn w-48 ${vtype === t ? (t === "P" ? "btn-orange" : "btn-orange") : "btn-dark"}`}>{label}</Link>
  );
  return (
    <Page title="Voucher" level={u.level} rail={{}}>
      <div className="mb-4 flex gap-3">{tab("P", "Payment")}{tab("R", "Receipt")}</div>
      <VoucherForm key={`${vtype}-${editing?.id ?? "new"}`} init={init} accounts={accounts} level={u.level} base={u.currency} rates={rates} />
      <section className="card mt-5 p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted">{vtype === "P" ? "PAYMENTS HISTORY" : "RECEIPT HISTORY"}</h2>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>S.No.</th><th>Date</th><th>From</th><th>To</th><th className="r">Amount</th><th className="c">Edit</th><th className="c">Delete</th><th className="c">Voucher</th></tr></thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted">No {vtype === "P" ? "payments" : "receipts"} in the last month.</td></tr>}
              {history.map((e, i) => (
                <tr key={e.id}>
                  <td>{i + 1}.</td>
                  <td className="num whitespace-nowrap">{dotDate(e.date)}</td>
                  <td>{e.from_name}</td>
                  <td>{e.to_name}</td>
                  <td className="r num">{money(e.amount)}</td>
                  <td className="c"><Link href={`/voucher?edit=${e.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link></td>
                  <td className="c">
                    <ConfirmForm action={deleteVoucher} fields={{ id: e.id, back: `/voucher?t=${vtype}` }} message="Confirm Deletion of Transaction" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm>
                  </td>
                  <td className="c"><Link href={`/voucher/print/${e.id}`} target="_blank" aria-label="Voucher PDF" className="inline-flex text-red"><FileDown className="h-5 w-5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
