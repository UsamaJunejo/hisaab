"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { act, int, str } from "@/lib/act";
import { toPaisa } from "@/lib/format";
import { isCurrency } from "@/lib/currencies";
import { lockState } from "@/lib/plan";

export type VoucherState = { error?: string; n?: number };

const BAD = /\.(docx?|xlsx?|txt|pptx?|html?|exe|js|zip|rar)$/i;

export async function saveVoucher(_: VoucherState, f: FormData): Promise<VoucherState> {
  const u = await requireUser();
  const d = await db();
  const fail = (error: string): VoucherState => ({ error, n: Date.now() });
  if ((await lockState(d, u)) !== "ok") return fail("Your plan has ended or your data limit is used up. Please pay to continue.");
  const vtype = str(f, "vtype") === "R" ? "R" : "P";
  const id = int(f, "id");
  const amount = toPaisa(str(f, "amount"));
  const currency = str(f, "currency");
  const foreign = currency && currency !== u.currency && isCurrency(currency);
  const files: { name: string; mime: string; data: Buffer }[] = [];
  for (const x of f.getAll("files")) {
    if (!(x instanceof File) || !x.size) continue;
    if (BAD.test(x.name) || !(x.type.startsWith("image/") || x.type === "application/pdf")) return fail("File format not supported. Please attach pictures or PDF files.");
    if (x.size > 5 * 1024 * 1024) return fail(`${x.name} is too big (5 MB max).`);
    files.push({ name: x.name.slice(0, 120), mime: x.type, data: Buffer.from(await x.arrayBuffer()) });
  }
  const input: B.EntryInput = {
    vtype, date: str(f, "date"), amount: Number.isNaN(amount) ? 0 : amount, fromId: int(f, "from"), toId: int(f, "to"),
    note: str(f, "note"), highlight: /^#[0-9a-fA-F]{6}$/.test(str(f, "highlight")) && str(f, "highlight").toLowerCase() !== "#ffffff" ? str(f, "highlight") : null,
    currency: foreign ? currency : null,
    foreignAmount: foreign ? toPaisa(str(f, "foreign")) : null,
    rate: foreign ? Number(str(f, "rate")) || null : null,
  };
  if (foreign && (!input.foreignAmount || !input.rate)) return fail(`Please enter the amount in ${currency} and the rate.`);
  try {
    if (id) await B.updateEntry(d, u.id, id, input, files, f.getAll("remove").map(Number).filter(Boolean));
    else await B.addEntry(d, u.id, input, files);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Some Technical Issue");
  }
  revalidatePath("/", "layout");
  redirect(`/voucher?t=${vtype}&ok=${encodeURIComponent(id ? "Transaction Updated." : "Transaction Saved.")}`);
}

export async function deleteVoucher(f: FormData) {
  await act(str(f, "back") || "/voucher", (u, d) => B.deleteEntry(d, u.id, int(f, "id")), "Transaction Deleted");
}

export async function restoreVoucher(f: FormData) {
  await act(str(f, "back") || "/reports/deleted", (u, d) => B.restoreEntry(d, u.id, int(f, "id")), "Transaction Restored");
}
