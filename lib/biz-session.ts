import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "./auth.ts";
import { db } from "./db.ts";
import { businesses } from "./business.ts";

export const BIZ_COOKIE = "hs_biz";

/** The signed-in owner and the business they are working in (MunshiBaba: "Select Business"). No business yet: go and create one. */
export async function requireBusiness() {
  const u = await requireUser();
  const d = await db();
  const list = await businesses(d, u.id);
  if (!list.length) redirect("/business/profile?new=1");
  const want = Number((await cookies()).get(BIZ_COOKIE)?.value);
  const b = list.find((x) => x.id === want) ?? list[0];
  return { u, d, b, list };
}
