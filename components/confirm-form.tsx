"use client";

import { useState } from "react";

/** A small form whose button asks for confirmation first (MunshiBaba's "Confirm Deletion of Transaction"). */
export function ConfirmForm({ action, fields, message, children, className, title = "ALERT!" }: {
  action: (f: FormData) => Promise<void>; fields: Record<string, string | number>; message: string; children: React.ReactNode; className?: string; title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>{children}</button>
      {open && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-navy/40 p-4" role="alertdialog" aria-modal="true" onClick={() => setOpen(false)}>
          <form action={action} onClick={(e) => e.stopPropagation()} className="card w-full max-w-sm p-5">
            {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <h2 className="mb-2 text-sm font-bold tracking-wide text-red">{title}</h2>
            <p className="mb-4">{message}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-dark">Cancel</button>
              <button className="btn btn-red" autoFocus>Confirm</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
