import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ceoStats, pendingFunds } from "@/lib/billing";
import { Page } from "@/components/page";
import { decideFundsAction } from "@/app/actions/settings";

export const metadata = { title: "CEO Dashboard" };

export default async function Ceo() {
  const u = await requireUser();
  if (!u.is_admin) redirect("/dashboard");
  const d = await db();
  const [s, pend] = await Promise.all([ceoStats(d), pendingFunds(d)]);
  const tiles: [string, string | number][] = [
    ["Total Registered Users", s.registered], ["Total Active Users", s.active], ["Total In-Active Users Since 90 Days", s.inactive90], ["Total Invited Users", s.invited],
    ["Total Invitations Accepted Users", s.accepted], ["Total Invitations Pending Users", s.pending], ["Total Paid Amount", `${(s.paid_cents / 100).toFixed(2)} USD`],
    ["Total Active Transactions", s.entries], ["Total Active Transactions (Payment)", s.payments], ["Total Active Transactions (Receipt)", s.receipts],
    ["Total Attachments", s.attachments], ["Total Attachments in MB", (s.attachment_bytes / 1048576).toFixed(2)], ["(14 Days Free) Subscription Users", s.free],
    ["(Monthly) Subscription Users", s.monthly], ["(Yearly) Subscription Users", s.yearly], ["(Group) Subscription Users", s.group], ["Issues Reported", s.issues],
  ];
  return (
    <Page title="CEO Dashboard" level={u.level} rail={{}}>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs font-semibold tracking-wide text-muted uppercase">{l}</p><p className="num text-2xl font-semibold">{v}</p></div>)}
      </div>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide">FUNDS WAITING FOR CONFIRMATION ({pend.length})</h2>
        <table className="tbl"><thead><tr><th>Date</th><th>User</th><th>Method</th><th>Remarks</th><th className="r">Amount</th><th className="c">Confirm</th></tr></thead>
          <tbody>
            {pend.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted">Nothing waiting.</td></tr>}
            {pend.map((f) => (
              <tr key={f.id}><td className="num">{f.created_at}</td><td>{f.user}<br /><span className="text-xs text-muted">{f.email}</span></td><td>{f.method}</td><td>{f.remarks}</td><td className="r num">USD {(f.amount_cents / 100).toFixed(2)}</td>
                <td className="c"><div className="flex justify-center gap-1">
                  <form action={decideFundsAction}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="ok" value="1" /><button className="btn btn-green h-8 min-h-0 px-2">Received</button></form>
                  <form action={decideFundsAction}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="ok" value="0" /><button className="btn btn-red h-8 min-h-0 px-2">Reject</button></form>
                </div></td></tr>
            ))}
          </tbody></table>
      </div>
    </Page>
  );
}
