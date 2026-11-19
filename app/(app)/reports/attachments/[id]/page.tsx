import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { access } from "@/lib/books";
import { attachmentsOfAccount } from "@/lib/reports";
import { fmtDate, money } from "@/lib/format";
import { Page } from "@/components/page";

export default async function AccountAttachments({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const d = await db();
  const id = Number((await params).id);
  const acc = await access(d, u.id, id);
  if (!acc) notFound();
  const files = await attachmentsOfAccount(d, u.id, id);
  return (
    <Page title={`Attachments: ${acc.name}`} level={u.level} rail={{ search: true }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <a key={f.id} href={`/api/attachment/${f.id}`} target="_blank" data-search={`${f.name} ${f.note ?? ""}`} className="card overflow-hidden hover:shadow-lg">
            {f.mime.startsWith("image/") ? <img src={`/api/attachment/${f.id}`} alt={f.name} className="h-44 w-full object-cover" /> : <div className="grid h-44 place-items-center bg-red-soft font-bold text-red">PDF</div>}
            <div className="p-3 text-sm"><p className="truncate font-semibold">{f.name}</p><p className="text-muted">{fmtDate(f.date, u.date_format)} · {money(f.amount)}{f.note ? ` · ${f.note}` : ""}</p></div>
          </a>
        ))}
      </div>
    </Page>
  );
}
