"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { applyFilter } from "@/app/actions/chart";
import { FILTERS } from "@/lib/books";

/** DATE FILTER pop-up: Regular (list) or Custom (From/To). Applies everywhere until changed. */
export function DateFilterDialog({ back, current, allowAll = true, onClose }: { back: string; current?: { key: string; from?: string; to?: string } | null; allowAll?: boolean; onClose: () => void }) {
  const [mode, setMode] = useState(current?.key === "custom" ? "custom" : "regular");
  const list = FILTERS.filter(([k]) => allowAll || k !== "all");
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-navy/40 p-4" role="dialog" aria-modal="true" aria-labelledby="df-title" onClick={onClose}>
      <form action={applyFilter} onClick={(e) => e.stopPropagation()} className="card w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between bg-navy px-5 py-3 text-white">
          <h2 id="df-title" className="text-sm font-bold tracking-wide">DATE FILTER</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <input type="hidden" name="back" value={back} />
        <input type="hidden" name="mode" value={mode} />
        <div className="space-y-4 p-5">
          <label className="flex items-center gap-2 font-semibold"><input type="radio" checked={mode === "regular"} onChange={() => setMode("regular")} /> Regular</label>
          <select name="key" defaultValue={current && current.key !== "custom" ? current.key : "30"} disabled={mode !== "regular"} className="input" aria-label="Period">
            {list.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <label className="flex items-center gap-2 font-semibold"><input type="radio" checked={mode === "custom"} onChange={() => setMode("custom")} /> Custom</label>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" name="from" defaultValue={current?.from} disabled={mode !== "custom"} aria-label="From" className="input" />
            <input type="date" name="to" defaultValue={current?.to} disabled={mode !== "custom"} aria-label="To" className="input" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={onClose} className="btn btn-dark">Cancel</button>
          <button className="btn btn-green">Apply</button>
        </div>
      </form>
    </div>
  );
}
