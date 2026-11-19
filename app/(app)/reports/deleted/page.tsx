import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deletedByAccount } from "@/lib/reports";
import { money } from "@/lib/format";
import { Page } from "@/components/page";

export const metadata = { title: "Deleted Transactions Log" };

export default async function Deleted() {
  const u = await requireUser();
  const rows = await deletedByAccount(await db(), u.id);
  return (
    <Page title="Deleted Transactions Account Ledger" level={u.level} rail={{ search: true }}>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Accounts</th><th>Sub Category</th><th>Category</th><th className="r">Deleted</th><th className="r">Receipts</th><th className="r">Payments</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted">Nothing has been deleted.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.account_id} data-search={`${r.name} ${r.sub} ${r.category}`}>
                <td>{i + 1}.</td><td><Link href={`/reports/deleted/${r.account_id}`} className="font-medium hover:underline">{r.name}</Link></td><td>{r.sub}</td><td>{r.category}</td>
                <td className="r num">{r.count}</td><td className="r num">{money(r.receipts)}</td><td className="r num">{money(r.payments)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
