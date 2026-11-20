import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Entry } from "@/lib/books";
import { longDate, money, today } from "@/lib/format";
import { ReportHeader } from "@/components/report-header";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteVoucher } from "@/app/actions/voucher";

type U = Parameters<typeof ReportHeader>[0]["u"];

/** PAYMENT HISTORY / RECEIPT HISTORY (opened from the dashboard tiles), laid out like MunshiBaba's. */
export function VoucherHistory({ u, kind, rows, range, size, page }: { u: U; kind: "P" | "R"; rows: Entry[]; range: { from: string | null; to: string | null }; size: number; page: number }) {
  const word = kind === "P" ? "PAYMENTS" : "RECEIPTS";
  const back = kind === "P" ? "/reports/payments" : "/reports/receipts";
  const shown = rows.slice(0, size * page);
  const total = rows.reduce((s, e) => s + e.amount, 0);
  return (
    <>
      <ReportHeader u={u} share={{ kind: kind === "P" ? "payments" : "receipts", back }} size={size} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">{kind === "P" ? "PAYMENT HISTORY" : "RECEIPT HISTORY"}</h2>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="card overflow-hidden"><p className="th-grey px-4 py-2 text-center">TRANSACTIONS</p><p className="num p-3 text-center text-lg font-semibold">{rows.length}</p></div>
        <div className="card overflow-hidden"><p className="th-grey px-4 py-2 text-center">{word}</p><p className="num p-3 text-center text-lg font-semibold">{money(total)}</p></div>
        <div className="card overflow-hidden">
          <p className="th-grey px-4 py-2 text-center">DATE</p>
          <dl className="grid grid-cols-[4rem_1fr] gap-2 p-3 text-sm">
            <dt className="font-semibold">FROM</dt><dd>{range.from ? longDate(range.from) : "FIRST ENTRY"}</dd>
            <dt className="font-semibold">TO</dt><dd>{longDate(range.to ?? today())}</dd>
          </dl>
        </div>
      </div>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">{word}</th><th className="c">Edit</th><th className="c">Action</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">Nothing in this period.</td></tr>}
            {shown.map((e, i) => (
              <tr key={e.id} data-search={`${e.note ?? ""} ${e.from_name} ${e.to_name}`} style={{ background: e.highlight ?? undefined }}>
                <td>{i + 1}.</td>
                <td className="num whitespace-nowrap">{e.date.slice(0, 10)}</td>
                <td>{e.note ? `${e.note} ` : ""}[To: {e.to_name} ]</td>
                <td className="r num">{money(e.amount)}</td>
                <td className="c"><Link href={`/voucher?edit=${e.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link></td>
                <td className="c"><ConfirmForm action={deleteVoucher} fields={{ id: e.id, back }} message="Confirm Deletion of Transaction" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {shown.length < rows.length && (
              <tr><td colSpan={6} className="c"><Link href={`${back}?size=${size}&page=${page + 1}`} className="text-blue underline">Load more entries ({rows.length - shown.length} more)</Link></td></tr>
            )}
            <tr><td /><td /><td className="r">TOTAL:</td><td className="r num">{money(total)}</td><td colSpan={2} /></tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
