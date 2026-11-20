import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currencyLedger, usedCurrencies } from "@/lib/reports";
import { getFilter, pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { QuerySelect } from "@/components/query-select";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteVoucher } from "@/app/actions/voucher";

export const metadata = { title: "Currency Ledger" };

/** CURRENCY LEDGER: entries made in one foreign currency, laid out like the account ledger,
 *  with TOTAL and OPENING in your currency and in the foreign one ("TOTAL(USD)"). */
export default async function CurrencyLedger({ searchParams }: { searchParams: Promise<{ c?: string; page?: string; size?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const sp = await searchParams;
  const size = [25, 50, 100, 150, 200, 250].includes(Number(sp.size)) ? Number(sp.size) : 25;
  const page = Math.max(1, Number(sp.page) || 1);
  const used = await usedCurrencies(d, u.id);
  const cur = sp.c && used.includes(sp.c) ? sp.c : used[0];
  const r = await pageRange("month");
  const L = cur ? await currencyLedger(d, u.id, cur, r) : null;
  const back = `/reports/currency${cur ? `?c=${cur}` : ""}`;
  const tB = { in: 0, out: 0 }, tF = { in: 0, out: 0 };
  let run = L?.opening.base ?? 0;
  const rows = (L?.rows ?? []).map((x) => {
    const k = x.vtype === "R" ? "in" : "out";
    tB[k] += x.amount; tF[k] += x.foreign_amount;
    run += x.vtype === "R" ? x.amount : -x.amount;
    return { ...x, running: run };
  });
  const shown = rows.slice(0, size * page);
  return (
    <Page title="Currency Ledger" level={u.level} rail={{ search: true, filter: { back, current: await getFilter(), allowAll: false } }}>
      <ReportHeader u={u} share={{ kind: "currency", back }} size={size} extra={used.length ? <QuerySelect name="c" value={cur!} options={used.map((c) => [c, c])} label="Select Currency" /> : null} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">CURRENCY LEDGER</h2>
      {!cur ? <p className="card p-6 text-center text-muted">No entries in another currency yet. In VOUCHER, pick a currency next to the amount to record one.</p> : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="card overflow-hidden">
              <p className="th-grey px-4 py-2 text-center">ACCOUNT</p>
              <dl className="num grid grid-cols-[4rem_1fr] gap-2 p-3 text-sm">
                <dt className="font-semibold">{u.currency}</dt><dd>{money(run)}</dd>
                <dt className="font-semibold">{cur}</dt><dd>{money(L!.opening.foreign + tF.in - tF.out)}</dd>
              </dl>
            </div>
            <div className="card overflow-hidden">
              <p className="th-grey px-4 py-2 text-center">DATE</p>
              <dl className="grid grid-cols-[4rem_1fr] gap-2 p-3 text-sm">
                <dt className="font-semibold">FROM</dt><dd>{r.from ? longDate(r.from) : "FIRST ENTRY"}</dd>
                <dt className="font-semibold">TO</dt><dd>{longDate(r.to ?? today())}</dd>
              </dl>
            </div>
          </div>
          <div className="card overflow-x-auto p-3">
            <table className="tbl">
              <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">Payments</th><th className="r">Receipts</th><th className="r">Balance</th><th className="c">Status</th><th className="c">Edit</th><th className="c">Action</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted">No {cur} entries in this period.</td></tr>}
                {shown.map((x, i) => (
                  <tr key={x.id} data-search={`${x.note ?? ""} ${x.from_name} ${x.to_name}`}>
                    <td>{i + 1}.</td>
                    <td className="num whitespace-nowrap">{x.date.slice(0, 10)}</td>
                    <td>{x.note ? `${x.note} ` : ""}{x.vtype === "P" ? `[To: ${x.to_name} ]` : `[From: ${x.from_name} ]`}<b className="ml-1 text-green">{cur} {money(x.foreign_amount)} / {x.rate}</b></td>
                    <td className="r num">{x.vtype === "P" ? money(x.amount) : ""}</td>
                    <td className="r num">{x.vtype === "R" ? money(x.amount) : ""}</td>
                    <td className={`r num ${x.running < 0 ? "text-red" : ""}`}>{money(x.running)}</td>
                    <td />
                    <td className="c"><Link href={`/voucher?edit=${x.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link></td>
                    <td className="c"><ConfirmForm action={deleteVoucher} fields={{ id: x.id, back }} message="Confirm Deletion of Transaction" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {shown.length < rows.length && (
                  <tr><td colSpan={9} className="c"><Link href={`${back}&size=${size}&page=${page + 1}`} className="text-blue underline">Load more entries ({rows.length - shown.length} more)</Link></td></tr>
                )}
                <tr><td /><td /><td className="r">TOTAL:</td><td className="r num">{money(tB.out)}</td><td className="r num">{money(tB.in)}</td><td colSpan={4} /></tr>
                <tr><td /><td /><td className="r">TOTAL({cur}):</td><td className="r num">{money(tF.out)}</td><td className="r num">{money(tF.in)}</td><td colSpan={4} /></tr>
                <tr><td /><td /><td className="r">OPENING:</td><td /><td /><td className="r num">{money(L!.opening.base)}</td><td colSpan={3} /></tr>
                <tr><td /><td /><td className="r">OPENING({cur}):</td><td /><td /><td className="r num">{money(L!.opening.foreign)}</td><td colSpan={3} /></tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Page>
  );
}
