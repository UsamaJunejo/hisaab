import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountBalances } from "@/lib/books";
import { budgets } from "@/lib/budget";
import { money } from "@/lib/format";
import { Page } from "@/components/page";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteBudgetAction, saveBudgetAction } from "@/app/actions/settings";

export const metadata = { title: "Budget Settings" };

export default async function Budget({ searchParams }: { searchParams: Promise<{ edit?: string; account?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const sp = await searchParams;
  const accs = await accountBalances(d, u.id);
  const list = await budgets(d, u.id);
  const edit = list.find((b) => b.id === Number(sp.edit));
  return (
    <Page title="Budget Settings" level={u.level} rail={{}}>
      <form action={saveBudgetAction} key={edit?.id ?? "new"} className="card mb-4 space-y-3 p-4 sm:p-5">
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <label className="field"><span className="field-label">Account</span>
          <select name="account" required defaultValue={edit?.account_id ?? sp.account ?? ""} className="field-input"><option value="" disabled>Select Account</option>{accs.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.category} - {a.sub})</option>)}</select></label>
        <label className="field"><span className="field-label">{u.currency}</span><input name="amount" required inputMode="decimal" defaultValue={edit ? edit.amount / 100 : ""} placeholder="Enter Amount" className="field-input num" /></label>
        <div className="field"><span className="field-label">Effective</span>
          <span className="flex flex-1 flex-wrap items-center gap-2 px-3 py-1.5 text-sm">From <input type="date" name="from" required defaultValue={edit?.start_date} className="input w-auto" /> To <input type="date" name="to" required defaultValue={edit?.end_date} className="input w-auto" /></span></div>
        <div className="flex justify-end gap-2"><Link href="/budget" className="btn btn-red">Reset</Link><button className="btn btn-green">{edit ? "Update" : "Save"}</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">BUDGET ACCOUNT</h2>
        <table className="tbl">
          <thead><tr><th>S.No.</th><th>Account</th><th className="c">Effective</th><th className="r">Amount</th><th className="c">Edit</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">No budgets yet.</td></tr>}
            {list.map((b, i) => (
              <tr key={b.id}><td>{i + 1}.</td><td>{b.account}</td><td className="c num">{b.start_date} to {b.end_date}</td><td className="r num">{money(b.amount)}</td>
                <td className="c"><Link href={`/budget?edit=${b.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link></td>
                <td className="c"><ConfirmForm action={deleteBudgetAction} fields={{ id: b.id }} message="Delete Budget Settings; Confirm!" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
