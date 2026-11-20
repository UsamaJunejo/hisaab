import { Rail, type RailSpec } from "@/components/shell/rail";

const SYSTEM = { 1: "ONE LEVEL SYSTEM", 2: "TWO LEVEL SYSTEM", 3: "THREE LEVEL SYSTEM" } as const;

/** A screen: title bar (title + optional badge, level system at right), content, and the grey rail. */
export function Page({ title, badge, level, rail, children }: { title: React.ReactNode; badge?: React.ReactNode; level: 1 | 2 | 3; rail?: RailSpec; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-8.6rem)]">
      <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2">
            <h1 className="page-title flex items-center gap-3">
              {title}
              {badge !== undefined && <span data-help="badge" className="num rounded-md bg-orange px-2 py-0.5 text-sm font-bold text-white">{badge}</span>}
            </h1>
            <span data-help="system" className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold tracking-wide shadow-sm">{SYSTEM[level]}</span>
          </div>
          {children}
          <footer className="no-print mt-10 flex items-center justify-center gap-3 border-t border-line pt-5 text-muted">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <div className="leading-tight"><p className="text-[0.65rem]">Personal Accounting System By:</p><p className="text-lg font-bold text-ink">hisaab<span className="text-orange">.app</span></p></div>
          </footer>
        </div>
      </main>
      <Rail spec={rail ?? {}} />
    </div>
  );
}
