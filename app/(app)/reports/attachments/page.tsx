import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachmentsByAccount } from "@/lib/reports";
import { Page } from "@/components/page";

export const metadata = { title: "Attachments" };
const mb = (b: number) => (b / 1048576).toFixed(2);

export default async function Attachments() {
  const u = await requireUser();
  const rows = await attachmentsByAccount(await db(), u.id);
  const files = rows.reduce((s, r) => s + r.files, 0), bytes = rows.reduce((s, r) => s + r.bytes, 0);
  return (
    <Page title="Attachments" level={u.level} rail={{ search: true }}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="card p-4"><p className="text-sm text-muted">Total No of Attachments</p><p className="num text-2xl font-semibold">{files}</p></div>
        <div className="card p-4"><p className="text-sm text-muted">Total Size of Attachments</p><p className="num text-2xl font-semibold">{mb(bytes)} MB</p></div>
      </div>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Accounts</th><th className="r">No of Attachments</th><th className="r">Attachments Data Size</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">No attachments yet. Attach a picture or PDF in the VOUCHER.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.account_id} data-search={r.name}><td>{i + 1}.</td><td><Link href={`/reports/attachments/${r.account_id}`} className="font-medium hover:underline">{r.name}</Link></td><td className="r num">{r.files}</td><td className="r num">{mb(r.bytes)} MB</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
