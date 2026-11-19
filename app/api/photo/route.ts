import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const u = await currentUser();
  if (!u) return new Response(null, { status: 401 });
  const [r] = await (await db()).q<{ photo: Uint8Array | null }>("SELECT photo FROM users WHERE id = $1", [u.id]);
  if (!r?.photo) return new Response(null, { status: 404 });
  return new Response(Buffer.from(r.photo), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000" } });
}
