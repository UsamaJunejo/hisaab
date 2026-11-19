import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/share";

export async function GET() {
  const u = await currentUser();
  if (!u) return new Response("[]", { status: 401 });
  return Response.json(await notifications(await db(), u.id));
}

/** Opening the bell marks the plain messages (no Accept/Reject buttons) as read. */
export async function POST() {
  const u = await currentUser();
  if (!u) return new Response(null, { status: 401 });
  await (await db()).q(
    `UPDATE notifications n SET is_read = true WHERE n.user_id = $1 AND NOT n.is_read AND n.created_at < now() - interval '2 seconds'
     AND NOT (n.kind = 'transaction' AND EXISTS (SELECT 1 FROM entries e WHERE e.id = n.ref_id AND e.status IN (0, 1) AND e.deleted_at IS NULL))
     AND NOT (n.kind = 'activity' AND EXISTS (SELECT 1 FROM shares s WHERE s.id = n.ref_id AND s.status = 'pending'))`,
    [u.id],
  );
  return new Response(null, { status: 204 });
}
