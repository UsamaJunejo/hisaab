import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, type Db } from "./db.ts";
import { requireUser, type User } from "./auth.ts";

/** Run a change for the signed-in user, then go back with an INFO:/ALERT! message (?ok= / ?error=). */
export async function act(back: string, fn: (u: User, d: Db) => Promise<unknown>, ok?: string): Promise<never> {
  const u = await requireUser();
  let msg = "";
  try {
    await fn(u, await db());
    msg = ok ? `ok=${encodeURIComponent(ok)}` : "";
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // a redirect from inside fn
    msg = `error=${encodeURIComponent(e instanceof Error ? e.message : "Some Technical Issue")}`;
  }
  revalidatePath("/", "layout");
  const safe = back.startsWith("/") && !back.startsWith("//") ? back : "/dashboard";
  redirect(msg ? `${safe}${safe.includes("?") ? "&" : "?"}${msg}&n=${Date.now() % 100000}` : safe);
}

export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const int = (f: FormData, k: string) => Number(f.get(k)) || 0;
