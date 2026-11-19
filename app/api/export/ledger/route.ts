import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { access, ledger } from "@/lib/books";
import { pageRange } from "@/lib/filter";
import { csv, csvResponse } from "@/lib/csv";

/** "Account Ledger" in Excel (CSV): the same rows as the screen for the chosen dates. */
export async function GET(req: Request) {
  const u = await currentUser();
  if (!u) return new Response("Not signed in", { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const d = await db();
  const acc = await access(d, u.id, id);
  if (!acc) return new Response("Not found", { status: 404 });
  const L = await ledger(d, u.id, id, await pageRange("month"), 1, 1_000_000);
  const rows: (string | number)[][] = [["S.No", "Date", "Narration", "Payments", "Receipts", "Balance"]];
  L.rows.forEach((r, i) => rows.push([i + 1, r.date, `${r.note ?? ""} [${r.direction === "from" ? "From" : "To"}: ${r.other}]`.trim(), r.out ? r.out / 100 : "", r.in ? r.in / 100 : "", (r.running ?? 0) / 100]));
  rows.push(["", "", "TOTAL", L.totalOut / 100, L.totalIn / 100, ""], ["", "", "OPENING", "", "", L.opening / 100]);
  return csvResponse(`Account Ledger - ${acc.name}.csv`, csv(rows));
}
