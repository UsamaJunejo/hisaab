import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { requireBusiness } from "@/lib/biz-session";
import { LISTS, listRows, type ListKey } from "@/lib/business";
import { BizPage, BizFields } from "@/components/biz/biz-page";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteListAction, saveListAction } from "@/app/actions/business";

export const metadata = { title: "Business Settings" };

/** Warehouses / Store's, Product Categories, Tax Setup and Discount Setup: a form and a list. */
export default async function BizList({ params, searchParams }: { params: Promise<{ list: string }>; searchParams: Promise<{ edit?: string }> }) {
  const key = (await params).list as ListKey;
  if (!(key in LISTS)) notFound();
  const { u, d, b, list } = await requireBusiness();
  const L = LISTS[key];
  const rows = await listRows(d, u.id, b.id, key);
  const editId = Number((await searchParams).edit);
  const editing = rows.find((r) => r.id === editId);
  return (
    <BizPage title={L.title} u={u} b={b} list={list}>
      <form action={saveListAction} key={String(editing?.id ?? "new")} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <BizFields biz={b.id} /><input type="hidden" name="key" value={key} /><input type="hidden" name="id" value={editing?.id ?? 0} />
        {L.fields.map(([name, label, req, kind]) => (
          <label key={name} className="text-sm font-semibold">{label}
            {Array.isArray(kind)
              ? <select name={name} defaultValue={String(editing?.[name] ?? kind[0])} className="input mt-1">{kind.map((k) => <option key={k} value={k}>{k === "percent" ? "Percent" : "Amount"}</option>)}</select>
              : <input name={name} required={!!req} inputMode={kind === "number" ? "decimal" : undefined} defaultValue={String(editing?.[name] ?? "")} placeholder={label} className="input mt-1" />}
          </label>
        ))}
        <div className="flex items-end justify-end gap-2 sm:col-span-3">{editing && <a href={`/business/settings/${key}`} className="btn btn-ghost">Cancel</a>}<button className="btn btn-green">{editing ? "Update" : "Save"}</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S/No</th>{L.fields.map(([n, l]) => <th key={n}>{l.replace(/ Name$/, "")}</th>)}<th className="c">Edit</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={L.fields.length + 3} className="py-6 text-center text-muted">Nothing added yet.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id as number} data-search={String(r.name)}>
                <td>{i + 1}.</td>{L.fields.map(([n]) => <td key={n}>{n === "kind" ? (r[n] === "percent" ? "Percent" : "Amount") : String(r[n] ?? "")}</td>)}
                <td className="c"><a href={`/business/settings/${key}?edit=${r.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></a></td>
                <td className="c"><ConfirmForm action={deleteListAction} fields={{ biz: b.id, key, id: r.id as number }} message={`Delete ${r.name}?`} className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BizPage>
  );
}
