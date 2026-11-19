"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { saveNode } from "@/app/actions/chart";
import { CatIcon, COLORS, ICON_NAMES } from "@/components/icons";
import { NATURES } from "@/lib/books";

export type NodeSpec = {
  level: "category" | "sub" | "account";
  op: "add" | "edit";
  id?: number;
  parent?: number;
  name?: string;
  nature?: string;
  color?: string;
  icon?: string;
  locked?: boolean; // PAYABLES / RECEIVABLES: name & nature can't change
  askNature?: boolean; // 2-level / 1-level systems: pick a nature when adding
  back: string;
};

const TITLE = { category: "CATEGORY", sub: "SUB CATEGORY", account: "ACCOUNT" };

/** Add / edit pop-up: name, (nature), colour grid, icon grid, Delete (edit only), Cancel, Apply. */
export function NodeDialog({ spec, onClose }: { spec: NodeSpec; onClose: () => void }) {
  const [color, setColor] = useState(spec.color ?? "#000000");
  const [icon, setIcon] = useState(spec.icon ?? "plus-circle");
  const [pick, setPick] = useState<"none" | "color" | "icon">("none");
  const [confirmDel, setConfirmDel] = useState(false);
  const showNature = spec.level === "category" || spec.askNature;
  const placeholder = spec.level === "category" ? "Enter Level 1 Name" : "Enter Name";
  const label = spec.level === "category" ? "Category Name" : spec.level === "sub" ? "Sub Category" : "Account Name";
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-navy/40 p-4" role="dialog" aria-modal="true" aria-labelledby="nd-title" onClick={onClose}>
      <form action={saveNode} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between bg-navy px-5 py-3 text-white">
          <h2 id="nd-title" className="text-sm font-bold tracking-wide">{spec.op === "add" ? "ADD NEW" : "EDIT"} {TITLE[spec.level]}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <input type="hidden" name="level" value={spec.level} />
          <input type="hidden" name="op" value={confirmDel ? "delete" : spec.op} />
          <input type="hidden" name="id" value={spec.id ?? ""} />
          <input type="hidden" name="parent" value={spec.parent ?? ""} />
          <input type="hidden" name="back" value={spec.back} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value={icon} />
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="nd-name">{label}</label>
            <input id="nd-name" name="name" required defaultValue={spec.name} disabled={spec.locked} placeholder={placeholder} autoFocus className="input" />
            {spec.locked && <input type="hidden" name="name" value={spec.name} />}
          </div>
          {showNature && (
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="nd-nature">Select Nature</label>
              <select id="nd-nature" name="nature" defaultValue={spec.nature ?? "Assets"} disabled={spec.locked} className="input">
                {NATURES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setPick(pick === "color" ? "none" : "color")} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm font-semibold">
              Color <span className="h-6 w-6 rounded-md ring-1 ring-black/10" style={{ background: color }} />
            </button>
            <button type="button" onClick={() => setPick(pick === "icon" ? "none" : "icon")} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm font-semibold">
              Icon <span className="grid h-7 w-7 place-items-center rounded-md text-white" style={{ background: color }}><CatIcon name={icon} className="h-4 w-4" /></span>
            </button>
          </div>
          {pick === "color" && (
            <div className="grid grid-cols-10 gap-1.5" role="listbox" aria-label="Colours">
              {COLORS.map((c) => (
                <button key={c} type="button" aria-label={c} aria-selected={c === color} onClick={() => { setColor(c); setPick("none"); }}
                  className={`aspect-square rounded-md ${c === color ? "ring-2 ring-ink ring-offset-1" : ""}`} style={{ background: c }} />
              ))}
            </div>
          )}
          {pick === "icon" && (
            <div className="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-line p-2" role="listbox" aria-label="Icons">
              {ICON_NAMES.map((n) => (
                <button key={n} type="button" title={n} aria-label={n} aria-selected={n === icon} onClick={() => { setIcon(n); setPick("none"); }}
                  className={`grid aspect-square place-items-center rounded-md ${n === icon ? "bg-orange text-white" : "hover:bg-page"}`}>
                  <CatIcon name={n} className="h-5 w-5" />
                </button>
              ))}
            </div>
          )}
          {confirmDel && <p className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">Press Delete again to confirm. This can&apos;t be undone.</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-line px-5 py-3">
          {spec.op === "edit" && !spec.locked && (
            confirmDel
              ? <button className="btn btn-red" formNoValidate>Delete</button>
              : <button type="button" onClick={() => setConfirmDel(true)} className="btn btn-red">Delete</button>
          )}
          <span className="flex-1" />
          <button type="button" onClick={onClose} className="btn btn-dark">Cancel</button>
          {!confirmDel && <button className="btn btn-green">Apply</button>}
        </div>
      </form>
    </div>
  );
}
