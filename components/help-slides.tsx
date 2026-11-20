"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ShownSlide = { key: string; section: string; title: string; img: string; text: string[]; marks?: string[]; spots?: [number, number][] };

/** HELP: a picture slide-show with Previous / Next and the list of slides by section (like MunshiBaba's "How to use"). */
export function HelpSlides({ slides, system }: { slides: ShownSlide[]; system: string }) {
  const [i, setI] = useState(0);
  const s = slides[i];
  const go = (n: number) => setI((n + slides.length) % slides.length);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  const sections = [...new Set(slides.map((x) => x.section))];
  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav aria-label="Help slides" className="card max-h-[70vh] overflow-y-auto p-2 text-sm">
        {sections.map((sec) => (
          <div key={sec} className="mb-2">
            <p className="px-2 py-1 text-xs font-bold tracking-wide text-muted uppercase">{sec === "Level system" ? system : sec}</p>
            {slides.map((x, n) => x.section === sec && (
              <button key={x.key} onClick={() => setI(n)} aria-current={n === i ? "step" : undefined}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${n === i ? "bg-navy text-white" : "hover:bg-page"}`}>
                <span className="num w-6 shrink-0 text-xs opacity-70">{String(n + 1).padStart(2, "0")}</span>{x.title}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <button onClick={() => go(i - 1)} className="btn btn-ghost h-9 min-h-0"><ChevronLeft className="h-4 w-4" />Previous</button>
          <h2 className="text-center font-bold uppercase"><span className="num mr-2 text-orange">{String(i + 1).padStart(2, "0")}</span>{s.title}</h2>
          <button onClick={() => go(i + 1)} className="btn btn-ghost h-9 min-h-0">Next<ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto bg-page p-3">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border border-line shadow">
            <img src={s.img} alt={`Screenshot: ${s.title}`} className="block w-full" />
            {s.spots?.map(([x, y], n) => x >= 0 && (
              <span key={n} className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-orange text-sm font-bold text-white shadow-lg ring-2 ring-white" style={{ left: `${x}%`, top: `${y}%` }}>{n + 1}</span>
            ))}
          </div>
        </div>
        <div className="space-y-2 p-4 text-sm">
          {s.text.map((t) => <p key={t}>{t}</p>)}
          {s.marks && <ol className="grid list-none gap-1 sm:grid-cols-2">{s.marks.map((m, n) => <li key={m} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange text-[0.7rem] font-bold text-white">{n + 1}</span>{m}</li>)}</ol>}
        </div>
      </div>
    </div>
  );
}
