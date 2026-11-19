import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vouchers } from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { fmtDate, longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteVoucher } from "@/app/actions/voucher";

export const metadata = { title: "Receipt History" };

export default async function History() {
  const u = await requireUser();
  const r = await pageRange("month");
  const rows = await vouchers(await db(), u.id, "R", r);
  const total = rows.reduce((s, e) => s + e.amount, 0);
  return (
    <Page title="Receipt History" level={u.level} rail={{ search: true, filter: { back: "/reports/receipts", current: await getFilter() } }}>
      <ReportHeader u={u} share={{ kind: "receipts", back: "/reports/receipts" }} />
      <p className="mb-3 text-center text-sm">FROM <b>{r.from ? longDate(r.from) : "FIRST ENTRY"}</b> TO <b>{longDate(r.to ?? today())}</b></p>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">RECEIPTS</th><th className="c">Edit</th><th className="c">Action</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">Nothing in this period.</td></tr>}
            {rows.map((e, i) => (
              <tr key={e.id} data-search={`${e.note ?? ""} ${e.from_name} ${e.to_name}`} style={{ background: e.highlight ?? undefined }}>
                <td>{i + 1}.</td><td className="num">{fmtDate(e.date, u.date_format)}</td><td>{e.note ? `${e.note} ` : ""}[{e.from_name} → {e.to_name}]</td>
                <td className="r num">{money(e.amount)}</td>
                <td className="c"><Link href={`/voucher?edit=${e.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link></td>
                <td className="c"><ConfirmForm action={deleteVoucher} fields={{ id: e.id, back: "/reports/receipts" }} message="Confirm Deletion of Transaction" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td /><td /><td className="r">TOTAL:</td><td className="r num">{money(total)}</td><td colSpan={2} /></tr></tfoot>
        </table>
      </div>
    </Page>
  );
}
