import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currencyLedger, usedCurrencies } from "@/lib/reports";
import { getFilter, pageRange } from "@/lib/filter";
import { fmtDate, longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { QuerySelect } from "@/components/query-select";

export const metadata = { title: "Currency Ledger" };

/** CURRENCY LEDGER: entries made in a foreign currency, with totals and opening in both currencies. */
export default async function CurrencyLedger({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const used = await usedCurrencies(d, u.id);
  const cur = (await searchParams).c ?? used[0];
  const r = await pageRange("month");
  const L = cur ? await currencyLedger(d, u.id, cur, r) : null;
  const tB = { in: 0, out: 0 }, tF = { in: 0, out: 0 };
  L?.rows.forEach((x) => { const k = x.vtype === "R" ? "in" : "out"; tB[k] += x.amount; tF[k] += x.foreign_amount; });
  return (
    <Page title="Currency Ledger" level={u.level} rail={{ search: true, filter: { back: "/reports/currency", current: await getFilter(), allowAll: false } }}>
      <ReportHeader u={u} share={{ kind: "currency", back: "/reports/currency" }} extra={used.length ? <QuerySelect name="c" value={cur!} options={used.map((c) => [c, c])} label="Select Currency" /> : null} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">CURRENCY LEDGER</h2>
      {!cur ? <p className="card p-6 text-center text-muted">No entries in another currency yet. In VOUCHER, pick a currency next to the amount to record one.</p> : (
        <>
          <p className="mb-3 text-center text-sm">FROM <b>{r.from ? longDate(r.from) : "FIRST ENTRY"}</b> TO <b>{longDate(r.to ?? today())}</b></p>
          <div className="card overflow-x-auto p-3">
            <table className="tbl">
              <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">Payments</th><th className="r">Receipts</th><th className="r">{cur} Payments</th><th className="r">{cur} Receipts</th><th className="r">Rate</th></tr></thead>
              <tbody>
                {L!.rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-muted">No {cur} entries in this period.</td></tr>}
                {L!.rows.map((x, i) => (
                  <tr key={x.id} data-search={`${x.note ?? ""} ${x.from_name} ${x.to_name}`}>
                    <td>{i + 1}.</td><td className="num">{fmtDate(x.date, u.date_format)}</td><td>{x.note ? `${x.note} ` : ""}[{x.from_name} → {x.to_name}]</td>
                    <td className="r num">{x.vtype === "P" ? money(x.amount) : ""}</td><td className="r num">{x.vtype === "R" ? money(x.amount) : ""}</td>
                    <td className="r num">{x.vtype === "P" ? money(x.foreign_amount) : ""}</td><td className="r num">{x.vtype === "R" ? money(x.foreign_amount) : ""}</td><td className="r num">{x.rate}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td /><td /><td className="r">TOTAL:</td><td className="r num">{money(tB.out)}</td><td className="r num">{money(tB.in)}</td><td className="r num">{money(tF.out)}</td><td className="r num">{money(tF.in)}</td><td /></tr>
                <tr><td /><td /><td className="r">OPENING:</td><td colSpan={2} className="r num">{u.currency} {money(L!.opening.base)}</td><td colSpan={2} className="r num">{cur} {money(L!.opening.foreign)}</td><td /></tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Page>
  );
}
