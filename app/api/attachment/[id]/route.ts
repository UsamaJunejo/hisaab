import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntry } from "@/lib/books";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return new Response("Not signed in", { status: 401 });
  const d = await db();
  const [a] = await d.q<{ entry_id: number; name: string; mime: string; data: Uint8Array }>("SELECT entry_id, name, mime, data FROM attachments WHERE id = $1", [Number((await params).id)]);
  if (!a || !(await getEntry(d, u.id, a.entry_id))) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(a.data), { headers: { "Content-Type": a.mime, "Content-Disposition": `inline; filename="${encodeURIComponent(a.name)}"`, "Cache-Control": "private, max-age=86400" } });
}
