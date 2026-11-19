import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fundsBalance, fundsHistory, METHODS } from "@/lib/billing";
import { Page } from "@/components/page";
import { PortalNav } from "@/components/portal-nav";
import { requestFundsAction, transferFundsAction } from "@/app/actions/settings";

export const metadata = { title: "Funds" };

export default async function Funds({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const tab = (await searchParams).tab === "transfer" ? "transfer" : "add";
  const [bal, hist] = await Promise.all([fundsBalance(d, u.id), fundsHistory(d, u.id)]);
  return (
    <Page title="Funds" level={u.level} rail={{}}>
      <PortalNav />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/portal/funds" className={`btn ${tab === "add" ? "btn-orange" : "btn-dark"}`}>Add Funds</Link>
        <Link href="/portal/funds?tab=transfer" className={`btn ${tab === "transfer" ? "btn-orange" : "btn-dark"}`}>Transfer Funds</Link>
        <span className="flex-1" />
        <div className="card px-4 py-2 text-sm">TOTAL FUNDS <b className="num">USD {(bal / 100).toFixed(2)} $</b></div>
      </div>
      <form action={tab === "add" ? requestFundsAction : transferFundsAction} className="card mb-4 grid gap-3 p-4 sm:grid-cols-2">
        <label className="field"><span className="field-label">Amount</span><input name="amount" required inputMode="decimal" placeholder="USD" className="field-input num" /></label>
        {tab === "add"
          ? <label className="field"><span className="field-label">Method</span><select name="method" required defaultValue="" className="field-input"><option value="" disabled>Select Payment Method</option>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></label>
          : <label className="field"><span className="field-label">Pay To</span><input name="to" required placeholder="Customer No. or Email" className="field-input" /></label>}
        <label className="field"><span className="field-label">Remarks</span><input name="remarks" placeholder={tab === "add" ? "e.g. JazzCash transaction ID" : "Remarks"} className="field-input" /></label>
        <label className="field"><span className="field-label">M-PIN</span><input name="mpin" type="password" inputMode="numeric" maxLength={4} required className="field-input" /></label>
        {!u.has_mpin && <p className="text-sm text-red sm:col-span-2">Set your 4 digit M-PIN in <Link href="/portal/profile" className="underline">Profile</Link> first.</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="reset" className="btn btn-red">Reset</button><button className="btn btn-green">{tab === "add" ? "Add" : "Transfer"}</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">FUNDS HISTORY</h2>
        <table className="tbl"><thead><tr><th>S.No.</th><th>Date</th><th>Type</th><th>Payment To</th><th className="r">Amount</th><th>Status</th></tr></thead>
          <tbody>
            {hist.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted">No funds yet.</td></tr>}
            {hist.map((f, i) => <tr key={f.id}><td>{i + 1}.</td><td className="num">{f.created_at}</td><td className="capitalize">{f.kind}{f.method ? ` (${f.method})` : ""}</td><td>{f.payment_to ?? f.remarks ?? ""}</td><td className="r num">USD {(f.amount_cents / 100).toFixed(2)}</td><td className={f.status === "Completed" ? "text-green" : f.status === "Rejected" ? "text-red" : "text-orange"}>{f.status}</td></tr>)}
          </tbody></table>
      </div>
    </Page>
  );
}
