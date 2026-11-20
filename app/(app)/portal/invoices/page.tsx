import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fundsBalance, invoices } from "@/lib/billing";
import { fmtDate, fmtTime } from "@/lib/format";
import { Page } from "@/components/page";
import { PortalNav } from "@/components/portal-nav";
import { newInvoiceAction, payInvoiceAction } from "@/app/actions/settings";

export const metadata = { title: "Invoices" };
const usd = (c: number) => `USD ${(c / 100).toFixed(2)} $`;

export default async function Invoices({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const u = await requireUser();
  const d = await db();
  // like MunshiBaba: "20-04-2022 01:38:46 AM" in your date and time format
  const dt = (s: string) => `${fmtDate(s, u.date_format)} ${fmtTime(s, u.time24)}`;
  const [list, funds] = await Promise.all([invoices(d, u.id), fundsBalance(d, u.id)]);
  const want = (await searchParams).plan;
  const current = list.find((i) => i.status === "UnPaid") ?? list[0];
  return (
    <Page title="Invoices" level={u.level} rail={{}}>
      <PortalNav />
      <div className="mb-4 grid gap-3 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="card p-4 text-center"><p className="text-sm text-muted">FUNDS AVAILABLE</p><p className="num text-2xl font-semibold">{usd(funds)}</p></div>
        {current && (
          <div className="card overflow-x-auto p-3">
            <table className="tbl"><thead><tr><th>Invoice #</th><th>Package</th><th className="r">Amount</th><th>Invoice Date</th><th>Payment Due On</th><th>Status</th><th /></tr></thead>
              <tbody><tr><td className="num">{current.number}</td><td>{current.package}</td><td className="r num">{usd(current.amount_cents)}</td><td className="num">{dt(current.created_at)}</td><td className="num">{dt(current.due_at)}</td>
                <td className={current.status === "UnPaid" ? "font-semibold text-red" : "font-semibold text-green"}>{current.status}</td>
                <td>{current.status === "UnPaid" && <form action={payInvoiceAction}><input type="hidden" name="id" value={current.id} /><button className="btn btn-green h-8 min-h-0">Pay from Funds</button></form>}</td></tr></tbody></table>
          </div>
        )}
      </div>
      <form action={newInvoiceAction} className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <p className="flex-1 text-sm font-semibold">Renew or upgrade your plan:</p>
        {([["monthly", "Single User Per Month · US $ 1"], ["yearly", "Single User Per Year · US $ 10"], ["group_monthly", "Group Per Month · US $ 3"], ["group_yearly", "Group Per Year · US $ 30"]] as const).map(([v, l]) => (
          <label key={v} className="flex items-center gap-2 text-sm"><input type="radio" name="plan" value={v} defaultChecked={(want ?? "monthly") === v} /> {l}</label>
        ))}
        <button className="btn btn-orange">Pay Now</button>
      </form>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">INVOICES HISTORY</h2>
        <table className="tbl"><thead><tr><th>S.No.</th><th>Invoice #</th><th>Package</th><th className="r">Amount</th><th>Invoice Date</th><th>Payment Due On</th><th>Status</th><th>Payment Made On</th></tr></thead>
          <tbody>{list.map((i, n) => (
            <tr key={i.id}><td>{n + 1}.</td><td className="num">{i.number}</td><td>{i.package}</td><td className="r num">{usd(i.amount_cents)}</td><td className="num">{dt(i.created_at)}</td><td className="num">{dt(i.due_at)}</td>
              <td className={i.status === "UnPaid" ? "text-red" : "text-green"}>{i.status}</td><td className="num">{i.paid_at ? dt(i.paid_at) : ""}</td></tr>
          ))}</tbody></table>
      </div>
    </Page>
  );
}
