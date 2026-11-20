import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deletedByAccount, SORTS } from "@/lib/reports";
import { money } from "@/lib/format";
import { Page } from "@/components/page";
import { QuerySelect } from "@/components/query-select";

export const metadata = { title: "Deleted Transactions Log" };

export default async function Deleted({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const u = await requireUser();
  const sort = (await searchParams).sort ?? "az";
  const rows = await deletedByAccount(await db(), u.id);
  const bal = (r: (typeof rows)[number]) => r.receipts - r.payments;
  const cmp: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name),
    low: (a, b) => bal(a) - bal(b), high: (a, b) => bal(b) - bal(a),
    last: (a, b) => b.last.localeCompare(a.last), first: (a, b) => a.last.localeCompare(b.last),
  };
  rows.sort(cmp[sort] ?? cmp.az);
  return (
    <Page title="Deleted Transactions Account Ledger" level={u.level} rail={{ search: true }}>
      <div className="mb-3 flex justify-end"><QuerySelect name="sort" value={sort} options={SORTS} label="Sort" /></div>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Accounts</th><th>Sub Category</th><th>Category</th><th className="r">Receipts</th><th className="r">Payments</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">Nothing has been deleted.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.account_id} data-search={`${r.name} ${r.sub} ${r.category}`}>
                <td>{i + 1}.</td><td><Link href={`/reports/deleted/${r.account_id}`} className="font-medium hover:underline">{r.name}</Link></td><td>{r.sub}</td><td>{r.category}</td>
                <td className="r num">{money(r.receipts)}</td><td className="r num">{money(r.payments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
