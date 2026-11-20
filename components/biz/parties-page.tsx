import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { requireBusiness } from "@/lib/biz-session";
import { partyBalances, parties, type PartyKind } from "@/lib/business";
import { money } from "@/lib/format";
import { BizPage, BizFields } from "./biz-page";
import { ConfirmForm } from "@/components/confirm-form";
import { deletePartyAction, savePartyAction } from "@/app/actions/business";

/** VENDORS and CUSTOMERS: a form and a list with what each one owes (each is an account in your books). */
export async function PartiesPage({ kind, edit }: { kind: PartyKind; edit?: string }) {
  const { u, d, b, list } = await requireBusiness();
  const [rows, bal] = await Promise.all([parties(d, u.id, b.id, kind), partyBalances(d, u.id, b.id, kind)]);
  const owed = new Map(bal.map((x) => [x.id, x.balance]));
  const e = rows.find((r) => r.id === Number(edit));
  const word = kind === "vendor" ? "Vendor" : "Customer";
  const field = (name: string, label: string, ph = label, type = "text") => (
    <label className="text-sm font-semibold">{label}<input name={name} type={type} required={name === "name"} defaultValue={(e as Record<string, unknown> | undefined)?.[name] as string ?? ""} placeholder={ph} className="input mt-1" /></label>
  );
  return (
    <BizPage title={`${word}s`} u={u} b={b} list={list}>
      <form action={savePartyAction} key={e?.id ?? "new"} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <BizFields biz={b.id} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={e?.id ?? 0} />
        {field("name", kind === "vendor" ? "Contact Person Name" : "Name", `${word} Name`)}
        {kind === "vendor" && field("company", "Company Name", "Vendor Company")}
        {field("contact", "Contact #", `${word} Contact`, "tel")}{field("email", "Email", `${word} Email`, "email")}
        {field("address", "Address", `${word} Address`)}{field("city", "City")}{field("state", "State")}{field("country", "Country")}
        {kind === "vendor" && <>{field("tax_no", "TAX Registration #", "TAX Registration")}{field("st_no", "ST Registration #", "ST Registration Number")}
          <label className="text-sm font-semibold">Terms of Sale<select name="terms" defaultValue={e?.terms ?? "BOTH"} className="input mt-1"><option>BOTH</option><option>CASH</option><option>CREDIT</option></select></label></>}
        <div className="flex items-end justify-end gap-2 sm:col-span-3">{e && <a href={`/business/${kind}s`} className="btn btn-ghost">Cancel</a>}<button className="btn btn-green">{e ? "Update" : "Save"}</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S/No</th><th>Name</th>{kind === "vendor" && <th>Company</th>}<th>Contact</th><th>Email</th><th>City</th><th className="r">{kind === "vendor" ? "You Owe" : "They Owe"}</th><th className="c">Ledger</th><th className="c">Edit</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={10} className="py-6 text-center text-muted">No {kind}s yet.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id} data-search={`${r.name} ${r.company ?? ""} ${r.contact ?? ""} ${r.email ?? ""}`}>
                <td>{i + 1}.</td><td className="font-medium">{r.name}</td>{kind === "vendor" && <td>{r.company}</td>}<td>{r.contact}</td><td>{r.email}</td><td>{r.city}</td>
                <td className={`r num ${(owed.get(r.id) ?? 0) < 0 ? "text-green" : ""}`}>{money(owed.get(r.id) ?? 0)}</td>
                <td className="c"><Link href={`/account/${r.account_id}`} className="text-blue underline">Open</Link></td>
                <td className="c"><a href={`/business/${kind}s?edit=${r.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></a></td>
                <td className="c"><ConfirmForm action={deletePartyAction} fields={{ biz: b.id, kind, id: r.id }} message={`Delete ${r.name}?`} className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">A minus means you have been paid (or have paid) more than the invoices: money held on account.</p>
      </div>
    </BizPage>
  );
}
