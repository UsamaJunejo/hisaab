import Link from "next/link";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { printDate, today } from "@/lib/format";
import { ShareStatement, PageSize } from "@/components/ledger-bits";
import { PrintButton } from "@/components/print-button";

/** The card at the top of every statement: user, PDF / Excel / Share / Print, print date, currency, page size. */
export function ReportHeader({ u, excel, share, size, extra }: { u: { name: string; phone: string | null; email: string; currency: string; photo_v: string | null }; excel?: string; share: { kind: string; refId?: string; back: string }; size?: number; extra?: React.ReactNode }) {
  return (
    <div className="card mb-4 flex flex-wrap items-start justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-navy text-lg font-bold text-white">
          {u.photo_v ? <img src={`/api/photo?v=${u.photo_v}`} alt="" className="h-full w-full object-cover" /> : u.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div className="border-l border-line pl-3 text-sm leading-relaxed"><p className="font-semibold">{u.name}</p><p>{u.phone}</p><p>{u.email}</p></div>
      </div>
      <div className="flex flex-col items-end gap-2 text-sm">
        <div className="no-print flex items-center gap-2">
          <PrintButton label="PDF" icon={<FileText className="h-5 w-5 text-red" />} />
          {excel && <Link href={excel} className="rounded-md p-1.5 hover:bg-page" title="Excel" aria-label="Download Excel"><FileSpreadsheet className="h-5 w-5 text-green" /></Link>}
          <ShareStatement {...share} />
          <PrintButton label="Print" icon={<Printer className="h-5 w-5" />} />
        </div>
        <p>Print Date: <b>{printDate(today())}</b></p>
        <p>Currency: <b>{u.currency}</b></p>
        {extra}
        {size && <div className="no-print"><PageSize value={size} /></div>}
      </div>
    </div>
  );
}
