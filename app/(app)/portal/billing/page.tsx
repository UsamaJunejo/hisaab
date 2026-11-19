import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices } from "@/lib/billing";
import { Page } from "@/components/page";
import { PortalNav } from "@/components/portal-nav";

export const metadata = { title: "Billing Info" };
const usd = (c: number) => `${(c / 100).toFixed(2)} $`;

export default async function Billing() {
  const u = await requireUser();
  const list = await invoices(await db(), u.id);
  const paid = list.filter((i) => i.status === "Paid"), unpaid = list.filter((i) => i.status === "UnPaid");
  const sum = (l: typeof list) => l.reduce((s, i) => s + i.amount_cents, 0);
  const table = (title: string, l: typeof list) => (
    <div className="card overflow-x-auto p-3"><h2 className="mb-2 text-sm font-bold tracking-wide text-muted">{title}</h2>
      <table className="tbl"><thead><tr><th>Invoice #</th><th>Package</th><th className="r">Amount</th><th>Date</th></tr></thead>
        <tbody>{l.length === 0 ? <tr><td colSpan={4} className="py-4 text-center text-muted">None</td></tr> : l.map((i) => <tr key={i.id}><td className="num">{i.number}</td><td>{i.package}</td><td className="r num">USD {usd(i.amount_cents)}</td><td className="num">{i.created_at.slice(0, 10)}</td></tr>)}</tbody></table></div>
  );
  return (
    <Page title="Billing Info" level={u.level} rail={{}}>
      <PortalNav />
      <div className="card mb-4 overflow-x-auto p-3">
        <table className="tbl"><thead><tr><th>Billing</th><th className="r">No.</th><th className="r">Amount</th></tr></thead>
          <tbody>
            <tr><td>TOTAL INVOICES</td><td className="r num">{list.length}</td><td className="r num">{usd(sum(list))}</td></tr>
            <tr><td>PAID INVOICES</td><td className="r num">{paid.length}</td><td className="r num">{usd(sum(paid))}</td></tr>
            <tr><td>UNPAID INVOICES</td><td className="r num">{unpaid.length}</td><td className="r num">{usd(sum(unpaid))}</td></tr>
          </tbody></table>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{table("PAID INVOICES", paid)}{table("UNPAID INVOICES", unpaid)}</div>
    </Page>
  );
}
