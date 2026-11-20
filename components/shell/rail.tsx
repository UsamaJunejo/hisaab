"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CircleHelp, Search, SquarePlus } from "lucide-react";
import { NodeDialog, type NodeSpec } from "@/components/node-dialog";
import { DateFilterDialog } from "@/components/date-filter";

export type RailSpec = {
  level?: string; // "LEVEL 1"
  search?: boolean;
  add?: NodeSpec & { label: string };
  filter?: { back: string; current?: { key: string; from?: string; to?: string } | null; allowAll?: boolean };
};

/** The grey column on the right: level, Back, Search, Add, Date filter, Help. */
export function Rail({ spec }: { spec: RailSpec }) {
  const router = useRouter();
  const [q, setQ] = useState<string | null>(null);
  const [dlg, setDlg] = useState<"add" | "filter" | null>(null);
  useEffect(() => {
    // Search filters anything marked data-search by its text.
    document.querySelectorAll<HTMLElement>("[data-search]").forEach((el) => {
      el.style.display = !q || el.dataset.search!.toLowerCase().includes(q.toLowerCase()) ? "" : "none";
    });
  }, [q]);
  useEffect(() => {
    const open = (e: Event) => setDlg((e as CustomEvent<"add" | "filter">).detail);
    window.addEventListener("hs-rail", open);
    return () => window.removeEventListener("hs-rail", open);
  }, []);
  const btn = "grid h-12 w-12 place-items-center rounded-xl text-white/85 hover:bg-rail-2 hover:text-white";
  return (
    <aside data-help="rail" className="no-print relative w-16 shrink-0 bg-rail">
      <div className="sticky top-[4.6rem] flex flex-col items-center gap-2 py-4">
        {spec.level && <span className="text-[0.62rem] font-bold tracking-wide text-orange">{spec.level}</span>}
        <button type="button" onClick={() => router.back()} aria-label="Back" title="Back" className={btn}><ArrowLeft className="h-6 w-6 rounded-full border-2 border-orange p-0.5 text-orange" /></button>
        {spec.search && <button type="button" onClick={() => setQ(q === null ? "" : null)} aria-label="Search" title="Search" className={btn}><Search className="h-6 w-6" /></button>}
        {spec.add && <button type="button" onClick={() => setDlg("add")} aria-label={spec.add.label} title={spec.add.label} className={btn}><SquarePlus className="h-6 w-6" /></button>}
        {spec.filter && <button type="button" onClick={() => setDlg("filter")} aria-label="Select Date Filter" title="Select Date Filter" className={btn}><CalendarDays className="h-6 w-6" /></button>}
        <Link href="/support/help" aria-label="Help" title="Help" className={btn}><CircleHelp className="h-6 w-6 rounded-full bg-green p-0.5 text-white" /></Link>
      </div>
      {q !== null && (
        <div className="fixed right-20 top-28 z-40 w-72">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQ(null)} placeholder="Search" aria-label="Search" className="input shadow-xl" />
        </div>
      )}
      {dlg === "add" && spec.add && <NodeDialog spec={spec.add} onClose={() => setDlg(null)} />}
      {dlg === "filter" && spec.filter && <DateFilterDialog {...spec.filter} onClose={() => setDlg(null)} />}
    </aside>
  );
}

/** Any button on the page can open the rail's Add or Date-filter pop-up. */
export const openRail = (which: "add" | "filter") => window.dispatchEvent(new CustomEvent("hs-rail", { detail: which }));
