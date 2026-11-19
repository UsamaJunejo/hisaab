import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/account";
import { Page } from "@/components/page";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteProjectAction, saveProjectAction } from "@/app/actions/settings";

export const metadata = { title: "Add Projects" };

export default async function Projects({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const u = await requireUser();
  const list = await projects(await db(), u.id);
  const editId = Number((await searchParams).edit);
  const edit = list.find((p) => p.id === editId);
  return (
    <Page title="Add Projects" level={u.level} rail={{}}>
      <form action={saveProjectAction} key={edit?.id ?? "new"} className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <label className="field min-w-64 flex-1"><span className="field-label">Project Name</span><input name="name" required defaultValue={edit?.name} className="field-input" /></label>
        <Link href="/projects" className="btn btn-red">Reset</Link><button className="btn btn-green">{edit ? "Update" : "Save"}</button>
      </form>
      <div className="card overflow-x-auto p-3">
        <h2 className="mb-2 text-sm font-bold tracking-wide text-muted">PROJECTS</h2>
        <table className="tbl"><thead><tr><th>S.No.</th><th>Project Name</th><th className="c">Edit</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">No projects yet.</td></tr>}
            {list.map((p, i) => (
              <tr key={p.id}><td>{i + 1}.</td><td>{p.name}</td><td className="c"><Link href={`/projects?edit=${p.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></Link></td>
                <td className="c"><ConfirmForm action={deleteProjectAction} fields={{ id: p.id }} message={`Delete project "${p.name}"?`} className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
