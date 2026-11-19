import { notFound } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { access } from "@/lib/books";
import { deletedOfAccount } from "@/lib/reports";
import { fmtDate, money } from "@/lib/format";
import { Page } from "@/components/page";
import { ConfirmForm } from "@/components/confirm-form";
import { restoreVoucher } from "@/app/actions/voucher";

/** Deleted entries of one account, with DELETED ON and a Restore button (MunshiBaba can't restore). */
export default async function DeletedAccount({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const d = await db();
  const id = Number((await params).id);
  const acc = await access(d, u.id, id);
  if (!acc) notFound();
  const rows = await deletedOfAccount(d, u.id, id);
  return (
    <Page title={`Deleted: ${acc.name}`} level={u.level} rail={{ search: true }}>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">Payments</th><th className="r">Receipts</th><th>Deleted On</th><th className="c">Restore</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted">Nothing deleted in this account.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id} data-search={`${r.note ?? ""} ${r.other}`}>
                <td>{i + 1}.</td><td className="num">{fmtDate(r.date, u.date_format)}</td><td>{r.note ? `${r.note} ` : ""}[{r.in ? "From" : "To"}: {r.other}]</td>
                <td className="r num">{r.out ? money(r.out) : ""}</td><td className="r num">{r.in ? money(r.in) : ""}</td><td className="num">{fmtDate(r.deleted_at, u.date_format)}</td>
                <td className="c"><ConfirmForm action={restoreVoucher} fields={{ id: r.id, back: `/reports/deleted/${id}` }} message="Bring this transaction back into your books?" title="INFO:" className="inline-flex text-green"><RotateCcw className="h-4 w-4" aria-label="Restore" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
