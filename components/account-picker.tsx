"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { money } from "@/lib/format";

export type PickItem = { id: number; name: string; category: string; sub: string; balance: number; owner: string | null };

/**
 * Searchable account drop-down (MunshiBaba uses select2). Grouping follows the level system:
 * 3 levels "CATEGORY - SUB-CATEGORY", 2 levels "SUB-CATEGORY", 1 level flat "Account ( Sub-category )".
 * showBalance adds "[ 1,234.00 ]" after each name.
 */
export function AccountPicker({ name, items, level, value, onChange, showBalance, placeholder = "Select Account", invalid }: {
  name: string; items: PickItem[]; level: 1 | 2 | 3; value: number | null; onChange: (id: number) => void; showBalance?: boolean; placeholder?: string; invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const label = (a: PickItem) => (level === 1 && !a.owner ? `${a.name} ( ${a.sub} )` : a.owner ? `${a.name} (${a.owner})` : a.name);
  const group = (a: PickItem) => (a.owner ? "SHARED" : level === 3 ? `${a.category} - ${a.sub}` : level === 2 ? a.sub : "");
  const list = useMemo(() => items.filter((a) => `${label(a)} ${group(a)}`.toLowerCase().includes(q.toLowerCase())), [items, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const sel = items.find((a) => a.id === value);
  const pick = (a: PickItem) => { onChange(a.id); setOpen(false); setQ(""); };
  let last = "";
  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <input type="hidden" name={name} value={value ?? ""} />
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-invalid={invalid}
        className={`flex h-full w-full items-center justify-between gap-2 px-3 py-2 text-left ${sel ? "" : "text-muted"} ${invalid ? "bg-red-soft" : ""}`}>
        <span className="truncate">{sel ? `${label(sel)}${showBalance ? `  [ ${money(sel.balance)} ]` : ""}` : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="h-4 w-4 text-muted" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setHi(0); }} placeholder="Search"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(list.length - 1, h + 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
                if (e.key === "Enter") { e.preventDefault(); if (list[hi]) pick(list[hi]); }
                if (e.key === "Escape") setOpen(false);
              }}
              className="w-full py-2.5 text-sm outline-none" aria-label="Search accounts" />
          </div>
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1 text-sm">
            {list.length === 0 && <li className="px-3 py-3 text-muted">No account found</li>}
            {list.map((a, i) => {
              const g = group(a);
              const head = g && g !== last ? (last = g) : null;
              return (
                <li key={a.id}>
                  {head && <div className="bg-page px-3 py-1 text-[0.7rem] font-bold tracking-wide text-muted uppercase">{head}</div>}
                  <button type="button" role="option" aria-selected={a.id === value} onMouseEnter={() => setHi(i)} onClick={() => pick(a)}
                    className={`flex w-full justify-between gap-2 px-4 py-2 text-left ${i === hi ? "bg-orange/10" : ""} ${a.id === value ? "font-semibold" : ""}`}>
                    <span className="truncate">{label(a)}</span>
                    {showBalance && <span className={`num shrink-0 ${a.balance < 0 ? "text-red" : "text-muted"}`}>[ {money(a.balance)} ]</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
