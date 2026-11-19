import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitationStats } from "@/lib/account";
import { Page } from "@/components/page";
import { PortalNav } from "@/components/portal-nav";

export const metadata = { title: "Invitations" };

export default async function Invitations() {
  const u = await requireUser();
  const list = await invitationStats(await db(), u.id);
  const groups: [string, typeof list][] = [
    ["Invitations Accepted", list.filter((i) => i.status === "accepted")], ["Invitations Rejected", list.filter((i) => i.status === "rejected")],
    ["Invitations Pending", list.filter((i) => i.status === "pending")], ["Active Users", list.filter((i) => i.active)], ["In Active Since 90 Days", list.filter((i) => i.inactive90)],
  ];
  return (
    <Page title="Invitations" level={u.level} rail={{}}>
      <PortalNav />
      <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[["Invitations Sent", list.length], ...groups.map(([l, g]) => [l, g.length] as [string, number])].map(([l, n]) => <div key={l} className="card p-3 text-center"><p className="text-xs font-semibold text-muted uppercase">{l}</p><p className="num text-2xl font-semibold">{n}</p></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(([l, g]) => (
          <div key={l} className="card overflow-x-auto p-3"><h2 className="mb-2 text-sm font-bold tracking-wide text-muted uppercase">{l}</h2>
            <table className="tbl"><thead><tr><th>Name</th><th>Email</th><th>Date</th></tr></thead>
              <tbody>{g.length === 0 ? <tr><td colSpan={3} className="py-3 text-center text-muted">None</td></tr> : g.map((i) => <tr key={i.id}><td>{i.name}</td><td>{i.email}</td><td className="num">{i.created_at}</td></tr>)}</tbody></table></div>
        ))}
      </div>
    </Page>
  );
}
