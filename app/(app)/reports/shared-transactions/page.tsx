import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sharedEntries } from "@/lib/share";
import { getFilter, pageRange } from "@/lib/filter";
import { fmtDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { QuerySelect } from "@/components/query-select";

export const metadata = { title: "Shared Transactions" };

const ST: Record<number, [string, string]> = { 0: ["Pending", "text-blue"], 1: ["Seen", "text-navy-2"], 2: ["Reject", "text-orange"], 3: ["Approved", "text-green"] };
const SORT: [string, string][] = [["az", "Account Name (A - Z)"], ["za", "Account Name (Z - A)"], ["low", "Low Balance First"], ["high", "High Balance First"], ["latest", "Latest Entry First"], ["oldest", "Oldest Entry First"]];

/** LIST OF SHARED ENTRIES: every entry in shared ledgers, with its status. */
export default async function SharedTransactions({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const u = await requireUser();
  const sort = (await searchParams).sort ?? "latest";
  const r = await pageRange("all");
  const rows = await sharedEntries(await db(), u.id, r.from ?? "1900-01-01", r.to ?? today());
  const cmp: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    latest: (a, b) => b.date.localeCompare(a.date), oldest: (a, b) => a.date.localeCompare(b.date), az: (a, b) => a.account.localeCompare(b.account),
    za: (a, b) => b.account.localeCompare(a.account), low: (a, b) => a.amount - b.amount, high: (a, b) => b.amount - a.amount,
  };
  rows.sort(cmp[sort] ?? cmp.latest);
  return (
    <Page title="List of Shared Entries" level={u.level} rail={{ search: true, filter: { back: "/reports/shared-transactions", current: await getFilter() } }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Total Entries <span className="text-blue">{rows.length}</span></p><QuerySelect name="sort" value={sort} options={SORT} label="Sort" /></div>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Date</th><th>Narration</th><th className="r">Amount</th><th className="c">Type</th><th className="c">Status</th><th className="c">Select</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted">No entries in shared ledgers.</td></tr>}
            {rows.map((e, i) => {
              const [label, cls] = e.deleted_at ? ["Deleted", "text-red"] : ST[e.status] ?? ["", ""];
              return (
                <tr key={e.id} data-search={`${e.note ?? ""} ${e.account} ${e.maker}`}>
                  <td>{i + 1}.</td><td className="num">{fmtDate(e.date, u.date_format)}</td>
                  <td>{e.note ? `${e.note} ` : ""}[{e.from_name} → {e.to_name}] <span className="text-muted">({e.maker})</span></td>
                  <td className="r num">{money(e.amount)}</td><td className="c">{e.vtype === "P" ? "Payment" : "Receipt"}</td>
                  <td className={`c font-semibold ${cls}`}>{label}</td>
                  <td className="c"><Link href={`/account/${e.account === e.to_name ? e.to_account_id : e.from_account_id}`} className="text-blue underline">View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
