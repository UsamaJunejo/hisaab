"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Paperclip, Share2, X } from "lucide-react";
import { transferAction } from "@/app/actions/share";
import { shareStatement } from "@/app/actions/report";

/** "Transactions Per Page" selector. */
export function PageSize({ value }: { value: number }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">Transactions Per Page:
      <select value={value} onChange={(e) => { const u = new URL(location.href); u.searchParams.set("size", e.target.value); u.searchParams.delete("page"); router.push(u.pathname + u.search); }} className="rounded-md border border-line px-2 py-1">
        {[25, 50, 100, 150, 200, 250].map((n) => <option key={n}>{n}</option>)}
      </select>
    </label>
  );
}

/** Paperclip: opens the entry's attachments as a slide-show (pictures shown, PDFs embedded). */
export function Attachments({ files }: { files: { id: number; name: string; mime: string }[] }) {
  const [i, setI] = useState<number | null>(null);
  if (!files.length) return null;
  const f = i === null ? null : files[i];
  return (
    <>
      <button type="button" onClick={() => setI(0)} aria-label={`${files.length} attachment(s)`} className="inline-flex items-center text-blue"><Paperclip className="h-4 w-4" /><span className="text-xs">{files.length}</span></button>
      {f && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-navy/70 p-4" role="dialog" aria-modal="true" onClick={() => setI(null)}>
          <div className="card relative w-full max-w-3xl p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between text-sm font-semibold"><span>Attachments ({i! + 1} / {files.length}) · {f.name}</span><button onClick={() => setI(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            {f.mime === "application/pdf" ? <iframe src={`/api/attachment/${f.id}`} title={f.name} className="h-[70vh] w-full rounded-lg" /> : <img src={`/api/attachment/${f.id}`} alt={f.name} className="mx-auto max-h-[70vh] rounded-lg object-contain" />}
            {files.length > 1 && (
              <>
                <button onClick={() => setI((i! - 1 + files.length) % files.length)} aria-label="Previous" className="absolute left-2 top-1/2 rounded-full bg-black/60 p-2 text-white"><ChevronLeft /></button>
                <button onClick={() => setI((i! + 1) % files.length)} aria-label="Next" className="absolute right-2 top-1/2 rounded-full bg-black/60 p-2 text-white"><ChevronRight /></button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Transfer an approved shared entry into one of your own accounts. */
export function TransferButton({ entry, title, accounts, back }: { entry: number; title: string; accounts: { id: number; name: string }[]; back: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Transfer" aria-label="Transfer" className="inline-flex text-blue"><ArrowLeftRight className="h-4 w-4" /></button>
      {open && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-navy/40 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <form action={transferAction} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md p-5">
            <input type="hidden" name="entry" value={entry} /><input type="hidden" name="back" value={back} />
            <h2 className="mb-1 text-sm font-bold tracking-wide">TRANSFER</h2>
            <p className="mb-3 text-sm text-muted">{title}</p>
            <label className="mb-1 block text-sm font-semibold" htmlFor="tr-acc">Select Account to transfer</label>
            <select id="tr-acc" name="account" required className="input mb-4">{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="btn btn-dark">Cancel</button><button className="btn btn-green">Transfer</button></div>
          </form>
        </div>
      )}
    </>
  );
}

/** "CONFIRMATION FOR SHARING": email this statement as a PDF to a name + email. */
export function ShareStatement({ kind, refId, back }: { kind: string; refId?: string; back: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-blue h-9 min-h-0 px-3 normal-case"><Share2 className="h-4 w-4" />Share</button>
      {open && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-navy/40 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <form action={shareStatement} onClick={(e) => e.stopPropagation()} className="card w-full max-w-sm space-y-3 p-5">
            <input type="hidden" name="kind" value={kind} /><input type="hidden" name="ref" value={refId ?? ""} /><input type="hidden" name="back" value={back} /><input type="hidden" name="url" value={typeof window !== "undefined" ? location.pathname + location.search : back} />
            <h2 className="text-sm font-bold tracking-wide">CONFIRMATION FOR SHARING</h2>
            <input name="name" required placeholder="Enter User Name" className="input" />
            <input name="email" type="email" required placeholder="Enter Email" className="input" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="btn btn-dark">Cancel</button><button className="btn btn-green">Send</button></div>
          </form>
        </div>
      )}
    </>
  );
}
