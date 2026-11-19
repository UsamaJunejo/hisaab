"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { act, int, str } from "@/lib/act";
import * as S from "@/lib/share";

/** Bell buttons: approve / reject an entry, or accept / decline a sharing request. */
export async function approveEntry(f: FormData) {
  const u = await requireUser();
  const d = await db();
  const share = int(f, "share");
  if (share) await S.answerShare(d, u.id, share, str(f, "status") === "accept");
  else await S.setEntryStatus(d, u.id, int(f, "id"), Number(str(f, "status")) === 3 ? 3 : 2);
  revalidatePath("/", "layout");
}

export async function shareSubmit(f: FormData) {
  const withUser = int(f, "user");
  const ids = f.getAll("share").map(Number).filter(Boolean);
  const choices = ids.map((id) => ({ accountId: id, permission: (str(f, `perm_${id}`) === "write" ? "write" : "read") as "read" | "write", transfer: f.get(`tr_${id}`) === "on" }));
  let name = "";
  await act(str(f, "back") || "/share", async (u, d) => { name = await S.shareAccounts(d, u.id, withUser, choices); }, "Account sharing request sent. It becomes active once they accept it.");
  void name;
}

export async function removeShareAction(f: FormData) {
  await act(str(f, "back") || "/reports/shared-my", (u, d) => S.removeShare(d, u.id, int(f, "id")), "Account Sharing Removed");
}

export async function transferAction(f: FormData) {
  await act(str(f, "back"), (u, d) => S.transferEntry(d, u.id, int(f, "entry"), int(f, "account")), "Transfer Complete");
}

export async function entryStatusAction(f: FormData) {
  const s = Number(str(f, "status"));
  await act(str(f, "back"), (u, d) => S.setEntryStatus(d, u.id, int(f, "id"), s === 3 ? 3 : s === 2 ? 2 : 1), s === 3 ? "Transaction Approved" : s === 2 ? "Transaction Rejected" : undefined);
}
