import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntry } from "@/lib/books";
import { fmtDate, money } from "@/lib/format";
import { PrintNow } from "@/components/print-now";

/** Printable voucher (Save as PDF from the print dialog): number, date, currency, user, From, To, Amount, Note, attachments. */
export default async function PrintVoucher({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const d = await db();
  const e = await getEntry(d, u.id, Number((await params).id));
  if (!e) notFound();
  const files = await d.q<{ id: number; name: string; mime: string }>("SELECT id, name, mime FROM attachments WHERE entry_id = $1 ORDER BY id", [e.id]);
  const plan = { free: "14 Days Free", monthly: "Single Per Month", yearly: "Single Per Year" }[u.plan];
  return (
    <div className="fixed inset-0 z-[80] overflow-auto bg-white p-8">
      <PrintNow />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between border-b-4 border-orange pb-4">
          <div className="flex items-center gap-2 text-2xl font-bold"><img src="/logo.svg" alt="" className="h-10 w-10" /> hisaab<span className="text-orange">.app</span></div>
          <h1 className="text-xl font-bold tracking-wide">{e.vtype === "P" ? "PAYMENT" : "RECEIPT"} VOUCHER</h1>
        </div>
        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="font-semibold">Voucher No.</dt><dd className="num">HSB-{String(e.id).padStart(7, "0")}</dd>
          <dt className="font-semibold">Date</dt><dd>{fmtDate(e.date, u.date_format)}</dd>
          <dt className="font-semibold">Currency</dt><dd>{u.currency}</dd>
          {e.currency && <><dt className="font-semibold">Currency Rates</dt><dd className="num">{e.currency} {money(e.foreign_amount ?? 0)} @ {e.rate}</dd></>}
          <dt className="font-semibold">Name</dt><dd>{u.name}</dd>
          <dt className="font-semibold">Cell</dt><dd>{u.phone ?? "-"}</dd>
          <dt className="font-semibold">Email</dt><dd>{u.email}</dd>
          <dt className="font-semibold">Package</dt><dd>{plan}</dd>
        </dl>
        <table className="tbl mb-6">
          <thead><tr><th>From</th><th>To</th><th className="r">Amount</th></tr></thead>
          <tbody><tr><td>{e.from_name}</td><td>{e.to_name}</td><td className="r num text-lg font-bold">{money(e.amount)}</td></tr></tbody>
        </table>
        {e.note && <p className="mb-6 text-sm"><span className="font-semibold">Note: </span>{e.note}</p>}
        <div className="grid gap-4">
          {files.map((f) => f.mime.startsWith("image/") ? <img key={f.id} src={`/api/attachment/${f.id}`} alt={f.name} className="max-h-[28rem] rounded-lg border border-line object-contain" /> : <p key={f.id} className="text-sm">Attached PDF: {f.name}</p>)}
        </div>
      </div>
    </div>
  );
}
