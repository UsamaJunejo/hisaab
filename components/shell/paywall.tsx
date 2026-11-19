"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Shown when the plan has run out or the data limit is used up; VOUCHER, REPORTS and SHARE ACCOUNT open it. */
export function Paywall({ reason }: { reason: "ok" | "date" | "data" }) {
  const [open, setOpen] = useState(reason !== "ok");
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("hs-paywall", show);
    return () => window.removeEventListener("hs-paywall", show);
  }, []);
  if (!open || reason === "ok") return null;
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-navy/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="pw-t">
      <div className="card w-full max-w-md p-6 text-center">
        <h2 id="pw-t" className="mb-2 text-lg font-bold text-red">Sorry!</h2>
        <p className="mb-5">{reason === "data" ? "Your data limit is exceeded. Please recharge your data to continue using our services." : "Your invoice is past due. Please pay to continue using our services."}</p>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Link href="/portal/invoices?plan=monthly" className="rounded-xl border-2 border-orange p-3"><span className="block text-xs font-bold text-muted">SINGLE USER PER MONTH</span><span className="text-lg font-bold">US $ 1</span><span className="mt-1 block text-xs font-bold text-orange">PAY NOW</span></Link>
          <Link href="/portal/invoices?plan=yearly" className="rounded-xl border-2 border-orange p-3"><span className="block text-xs font-bold text-muted">SINGLE USER PER YEAR</span><span className="text-lg font-bold">US $ 10</span><span className="mt-1 block text-xs font-bold text-orange">PAY NOW</span></Link>
        </div>
        <button onClick={() => setOpen(false)} className="btn btn-dark">Cancel</button>
      </div>
    </div>
  );
}
