import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/share";

export async function GET() {
  const u = await currentUser();
  if (!u) return new Response("[]", { status: 401 });
  return Response.json(await notifications(await db(), u.id));
}
