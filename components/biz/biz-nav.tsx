"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Store } from "lucide-react";
import { BIZ_MENU } from "./menu";

/** The Business Module's side menu (a fold-out list on phones). */
export function BizNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = BIZ_MENU.flatMap((g) => g.items).find(([h]) => h === path)?.[1] ?? "Menu";
  return (
    <nav aria-label="Business menu" className="card self-start p-2 text-sm lg:sticky lg:top-24">
      <button className="flex w-full items-center justify-between rounded-md px-2 py-2 font-semibold lg:hidden" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2"><Store className="h-4 w-4 text-orange" />{current}</span><ChevronDown className="h-4 w-4" />
      </button>
      <div className={`${open ? "block" : "hidden"} max-h-[75vh] overflow-y-auto lg:block`} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}>
        {BIZ_MENU.map((g) => (
          <div key={g.group || "top"} className="mb-1">
            {g.group && <p className="px-2 pb-0.5 pt-2 text-[0.68rem] font-bold tracking-wide text-muted">{g.group}</p>}
            {g.items.map(([h, l]) => (
              <Link key={h} href={h} aria-current={path === h ? "page" : undefined} className={`block rounded-md px-2 py-1.5 ${path === h ? "bg-navy font-semibold text-white" : "hover:bg-page"}`}>{l}</Link>
            ))}
          </div>
        ))}
        <Link href="/dashboard" className="mt-2 block rounded-md bg-orange px-2 py-2 text-center text-xs font-bold tracking-wide text-white">SWITCH TO HISAAB</Link>
      </div>
    </nav>
  );
}
