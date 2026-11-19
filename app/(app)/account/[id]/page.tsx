import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, History, Pencil, Trash2, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { budgetFor } from "@/lib/budget";
import { getFilter, pageRange } from "@/lib/filter";
import { fmtDate, fmtTime, longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { Attachments, TransferButton } from "@/components/ledger-bits";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteVoucher } from "@/app/actions/voucher";
import { entryStatusAction } from "@/app/actions/share";

const STATUS = ["Send/Resend", "Pending", "Rejected", "Approved"];

export default async function AccountLedger({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string; size?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const id = Number((await params).id);
  const acc = await B.access(d, u.id, id);
  if (!acc) notFound();
  const sp = await searchParams;
  const size = [25, 50, 100, 150, 200, 250].includes(Number(sp.size)) ? Number(sp.size) : 25;
  const page = Math.max(1, Number(sp.page) || 1);
  const r = await pageRange("month");
  const f = await getFilter();
  const L = await B.ledger(d, u.id, id, r, page, size);
  const ids = [...L.rows, ...L.pending].map((x) => x.id);
  const files = ids.length ? await d.q<{ id: number; entry_id: number; name: string; mime: string }>("SELECT id, entry_id, name, mime FROM attachments WHERE entry_id = ANY($1::int[]) ORDER BY id", [ids]) : [];
  const logs = ids.length ? await d.q<{ entry_id: number; status: number; description: string; by: string | null; at: string }>(
    "SELECT l.entry_id, l.status, l.description, x.name AS by, l.at::text AS at FROM entry_status_log l LEFT JOIN users x ON x.id = l.by_user WHERE l.entry_id = ANY($1::int[]) ORDER BY l.at", [ids]) : [];
  const budget = acc.mine ? await budgetFor(d, u.id, id) : { current: null, history: [] };
  const myAccounts = (await B.accountBalances(d, u.id)).map((a) => ({ id: a.id, name: a.name }));
  const back = `/account/${id}`;
  const canSee = new Set((await B.voucherAccounts(d, u.id)).map((a) => a.id));
  const otherLink = (row: B.LedgerRow) => {
    const otherId = row.direction === "from" ? row.from_account_id : row.to_account_id;
    const word = row.direction === "from" ? "From" : "To";
    return <>[{word}: {canSee.has(otherId) ? <Link href={`/account/${otherId}`} className="underline">{row.other}</Link> : row.other} ]</>;
  };
  const statusCell = (row: B.LedgerRow) => {
    const steps = logs.filter((l) => l.entry_id === row.id);
    if (row.mine && !steps.length) return null;
    const label = steps.length ? STATUS[steps[steps.length - 1].status] ?? "" : row.status === 3 ? "Approved" : "Pending";
    return (
      <details className="relative inline-block text-left">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-blue">{!row.mine && <Users className="h-3.5 w-3.5" />}{label}</summary>
        <div className="absolute right-0 z-30 mt-1 w-64 rounded-lg border border-line bg-white p-2 text-xs shadow-xl">
          {steps.length === 0 && <p className="text-muted">No history</p>}
          {steps.map((s, i) => (
            <p key={i} className="border-b border-line py-1 last:border-0">
              {s.status === 3 && <Check className="mr-1 inline h-3 w-3 text-green" />}<b>{STATUS[s.status]}</b> · {s.description}{s.by ? ` by ${s.by}` : ""}<br />
              <span className="text-muted">{fmtDate(s.at.slice(0, 10), u.date_format)} {fmtTime(s.at, u.time24)}</span>
            </p>
          ))}
        </div>
      </details>
    );
  };
  const narration = (row: B.LedgerRow) => (
    <>
      {row.note ? `${row.note} ` : ""}{otherLink(row)}
      {row.currency && <b className="ml-1 text-green">{row.currency} {money(row.foreign_amount ?? 0)} / {row.rate}</b>}
      {!row.mine && <span className="text-muted"> ({row.maker})</span>}
    </>
  );
  const fileCell = (row: B.LedgerRow) => <Attachments files={files.filter((x) => x.entry_id === row.id)} />;
  const pct = budget.current ? Math.min(100, Math.round((budget.current.spent / budget.current.amount) * 100)) : 0;
  return (
    <Page title={acc.name} level={u.level} rail={{ search: true, filter: { back, current: f, allowAll: false } }}>
      <ReportHeader u={u} excel={`/api/export/ledger?id=${id}`} share={{ kind: "ledger", refId: String(id), back }} size={size} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">ACCOUNT ACTIVITY</h2>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="card overflow-hidden">
          <p className="th-grey px-4 py-2 text-center">Account</p>
          <dl className="grid grid-cols-[6rem_1fr] gap-2 p-3 text-sm">
            <dt className="font-semibold">Name:</dt><dd>{acc.name}{!acc.mine && <span className="text-muted"> ({acc.owner})</span>}</dd>
            <dt className="font-semibold">Balance</dt><dd className={`num font-semibold ${L.balance < 0 ? "text-red" : ""}`}>{money(L.balance)}</dd>
          </dl>
        </div>
        <div className="card overflow-hidden">
          <p className="th-grey flex items-center justify-center gap-2 px-4 py-2 text-center">Budget {budget.history.length > 0 && <Link href="/budget" title="Budget history"><History className="h-3.5 w-3.5" /></Link>}</p>
          {budget.current ? (
            <div className="space-y-2 p-3 text-sm">
              <div className="flex h-3 overflow-hidden rounded-full bg-green-soft" title={`Spent ${pct}%`}>
                <div className="bg-orange" style={{ width: `${pct}%` }} />
              </div>
              <dl className="num grid grid-cols-3 text-center text-xs">
                <div><dt className="text-muted">Left</dt><dd className="font-semibold">{money(budget.current.amount - budget.current.spent)}</dd></div>
                <div><dt className="text-muted">Spent</dt><dd className="font-semibold">{money(budget.current.spent)}</dd></div>
                <div><dt className="text-muted">Total</dt><dd className="font-semibold">{money(budget.current.amount)}</dd></div>
              </dl>
            </div>
          ) : (
            <div className="space-y-2 p-3 text-center text-xs font-semibold">
              <p>[ CURRENT ACTIVITY REPORT IS WITHOUT BUDGET ]</p>
              {acc.mine && <Link href={`/budget?account=${id}`} className="btn btn-blue h-8 min-h-0">Set Budget</Link>}
            </div>
          )}
        </div>
        <div className="card overflow-hidden">
          <p className="th-grey px-4 py-2 text-center">Date</p>
          <dl className="grid grid-cols-[4rem_1fr] gap-2 p-3 text-sm">
            <dt className="font-semibold">From</dt><dd>{r.from ? longDate(r.from) : "FIRST ENTRY"}</dd>
            <dt className="font-semibold">To</dt><dd>{longDate(r.to ?? today())}</dd>
          </dl>
        </div>
      </div>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead>
            <tr><th className="c">S.No</th><th className="c">Date</th><th>Narration</th><th className="r">Payments</th><th className="r">Receipts</th><th className="r">Balance</th><th className="c">Status</th><th className="c">Edit</th><th className="c">Action</th><th className="c" aria-label="Attachments">📎</th></tr>
          </thead>
          <tbody>
            {L.rows.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted">No transactions in this period. Use the date filter to see earlier ones.</td></tr>}
            {L.rows.map((row, i) => (
              <tr key={row.id} data-search={`${row.note ?? ""} ${row.other} ${row.amount / 100}`} style={{ background: row.highlight ?? undefined }}>
                <td className="c">{i + 1}.</td>
                <td className="c num whitespace-nowrap">{fmtDate(row.date, u.date_format)}</td>
                <td className="min-w-56">{narration(row)}</td>
                <td className="r num">{row.out ? money(row.out) : ""}</td>
                <td className="r num">{row.in ? money(row.in) : ""}</td>
                <td className={`r num ${(row.running ?? 0) < 0 ? "text-red" : ""}`}>{money(row.running ?? 0)}</td>
                <td className="c">{statusCell(row)}</td>
                <td className="c">{row.mine ? <Link href={`/voucher?edit=${row.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link> : <Pencil className="inline h-4 w-4 text-line" aria-hidden />}</td>
                <td className="c">
                  {row.mine ? (
                    <ConfirmForm action={deleteVoucher} fields={{ id: row.id, back }} message="Confirm Deletion of Transaction" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm>
                  ) : !acc.mine && acc.transfer && row.status === 3 && !row.transferred ? (
                    <TransferButton entry={row.id} title={`${row.note ?? ""} [${row.other}] Amount: ${money(row.amount)}`} accounts={myAccounts} back={back} />
                  ) : row.transferred ? <span className="text-xs text-muted">Transferred</span> : null}
                </td>
                <td className="c">{fileCell(row)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {L.rows.length < L.total && (
              <tr><td colSpan={10} className="c"><Link href={`${back}?size=${size}&page=${page + 1}`} className="text-blue underline">Load more entries ({L.total - L.rows.length} more)</Link></td></tr>
            )}
            <tr><td /><td /><td className="r">TOTAL:</td><td className="r num">{money(L.totalOut)}</td><td className="r num">{money(L.totalIn)}</td><td colSpan={5} /></tr>
            <tr><td /><td /><td className="r">OPENING:</td><td /><td /><td className="r num">{money(L.opening)}</td><td colSpan={4} /></tr>
          </tfoot>
        </table>
      </div>
      {L.pending.length > 0 && (
        <div className="card mt-4 overflow-x-auto p-3">
          <h3 className="mb-2 text-sm font-bold tracking-wide text-orange">WAITING FOR APPROVAL (not counted in the balance)</h3>
          <table className="tbl">
            <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">Payments</th><th className="r">Receipts</th><th className="c">Status</th><th className="c">Action</th><th className="c">📎</th></tr></thead>
            <tbody>
              {L.pending.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}.</td>
                  <td className="num whitespace-nowrap">{fmtDate(row.date, u.date_format)}</td>
                  <td>{narration(row)}</td>
                  <td className="r num">{row.out ? money(row.out) : ""}</td>
                  <td className="r num">{row.in ? money(row.in) : ""}</td>
                  <td className="c">{statusCell(row)}</td>
                  <td className="c">
                    {acc.mine && (
                      <form action={entryStatusAction} className="flex justify-center gap-1">
                        <input type="hidden" name="id" value={row.id} /><input type="hidden" name="back" value={back} />
                        <button name="status" value="3" className="btn btn-green h-8 min-h-0 px-2 text-[0.7rem]">Accept</button>
                        <button name="status" value="2" className="btn btn-red h-8 min-h-0 px-2 text-[0.7rem]">Reject</button>
                      </form>
                    )}
                  </td>
                  <td className="c">{fileCell(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
