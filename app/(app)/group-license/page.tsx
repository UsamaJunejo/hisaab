import { Trash2, Send } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { licenses } from "@/lib/account";
import { Page } from "@/components/page";
import { ConfirmForm } from "@/components/confirm-form";
import { addLicenseAction, deleteLicenseAction } from "@/app/actions/settings";

export const metadata = { title: "Group License" };

export default async function GroupLicense() {
  const u = await requireUser();
  const list = await licenses(await db(), u.id);
  const stat = (label: string, n: number) => <div className="card p-4 text-center"><p className="text-sm text-muted">{label}</p><p className="num text-2xl font-semibold">{n}</p></div>;
  return (
    <Page title="Group License" level={u.level} rail={{}}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">{stat("Total License", list.length)}{stat("Invitation Sent", list.length)}{stat("License Used", list.filter((l) => l.used).length)}</div>
      <form action={addLicenseAction} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <h2 className="text-sm font-bold tracking-wide sm:col-span-3">NEW INVITATION</h2>
        <input name="name" required placeholder="Enter Name" className="input" />
        <input name="email" type="email" required placeholder="Enter Email" className="input" />
        <input name="phone" placeholder="Enter Contact No" className="input" />
        <div className="flex justify-end gap-2 sm:col-span-3"><button type="reset" className="btn btn-red">Reset</button><button className="btn btn-green">Save</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">LICENSE DETAILS</h2>
        <table className="tbl"><thead><tr><th>S.No.</th><th>Date</th><th>Name</th><th>Email</th><th>Contact No</th><th className="c">Delete</th><th className="c">Re-Invite</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted">No licenses yet. Add people here to cover them under your plan.</td></tr>}
            {list.map((l, i) => (
              <tr key={l.id}><td>{i + 1}.</td><td className="num">{l.created_at}</td><td>{l.name}</td><td>{l.email}</td><td>{l.phone}</td>
                <td className="c"><ConfirmForm action={deleteLicenseAction} fields={{ id: l.id }} message={`Remove ${l.name}'s license?`} className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
                <td className="c"><a href={`/signup?ref=${u.customer_no}`} className="inline-flex text-blue" title="Copy this sign-up link and send it again"><Send className="h-4 w-4" /></a></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
