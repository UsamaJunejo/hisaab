"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell as BellIcon } from "lucide-react";
import { fmtDate, fmtTime, money, type DateFormat } from "@/lib/format";
import { approveEntry } from "@/app/actions/share";

type Note = { id: number; kind: "transaction" | "activity" | "alert"; text: string; created_at: string; ref_id: number | null;
  entry?: { maker: string; account: string; amount: number; date: string; note: string | null; status: number } | null;
  share?: { id: number; owner: string; account: string; status: string } | null };

/** Notifications: TRANSACTIONS (approve/reject), ACTIVITY (sharing), ALERTS (billing). Checks every 15 seconds. */
export function Bell({ time24, dateFormat }: { time24: boolean; dateFormat: DateFormat }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Note["kind"]>("transaction");
  const [items, setItems] = useState<Note[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (r.ok) setItems(await r.json());
    } catch { /* offline: try again next time */ }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => { clearInterval(t); document.removeEventListener("click", close); };
  }, [load]);
  const count = items.length;
  const of = (k: Note["kind"]) => items.filter((n) => n.kind === k);
  const when = (s: string) => `${fmtDate(s.slice(0, 10), dateFormat)} ${fmtTime(s, time24)}`;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { if (!open) setTimeout(() => fetch("/api/notifications", { method: "POST" }), 4000); setOpen((o) => !o); }} aria-label={`Notifications (${count})`} className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/10 hover:bg-white/20">
        <BellIcon className="h-6 w-6" />
        {count > 0 && <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-[0.7rem] font-bold">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-13 z-50 w-[22rem] overflow-hidden rounded-2xl bg-white text-ink shadow-2xl">
          <div className="grid grid-cols-3 bg-navy-2 text-[0.7rem] font-bold tracking-wide text-white">
            {(["transaction", "activity", "alert"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`px-2 py-3 ${tab === k ? "bg-white text-ink" : "hover:bg-white/10"}`}>
                {k === "transaction" ? "TRANSACTIONS" : k === "activity" ? "ACTIVITY" : "ALERTS"} {of(k).length}
              </button>
            ))}
          </div>
          <div className="max-h-[26rem] overflow-y-auto">
            {of(tab).length === 0 && <p className="p-6 text-center text-sm text-muted">Nothing new.</p>}
            {of(tab).map((n) => (
              <div key={n.id} className="border-b border-line p-4 text-sm">
                {n.entry ? (
                  <dl className="grid grid-cols-[6rem_1fr] gap-y-1">
                    <dt className="text-muted">User Name:</dt><dd>{n.entry.maker}</dd>
                    <dt className="text-muted">Account(s):</dt><dd>{n.entry.account}</dd>
                    <dt className="text-muted">Amount:</dt><dd className="num">{money(n.entry.amount)}</dd>
                    <dt className="text-muted">Date:</dt><dd>{fmtDate(n.entry.date, dateFormat)}</dd>
                    <dt className="text-muted">Note:</dt><dd>{n.entry.note || "-"}</dd>
                  </dl>
                ) : (
                  <p>{n.text}</p>
                )}
                <p className="mt-1 text-xs text-muted">{when(n.created_at)}</p>
                {n.kind === "transaction" && n.entry && (
                  <div className="mt-3 flex justify-between">
                    <Answer fields={{ id: n.ref_id ?? "", status: "3" }} label="Accept" cls="btn-green" done={load} />
                    <Answer fields={{ id: n.ref_id ?? "", status: "2" }} label="Reject" cls="btn-red" done={load} />
                  </div>
                )}
                {n.kind === "activity" && n.share?.status === "pending" && (
                  <div className="mt-3 flex justify-between">
                    <Answer fields={{ share: n.share.id, status: "accept" }} label="Accept sharing" cls="btn-green" done={load} />
                    <Answer fields={{ share: n.share.id, status: "decline" }} label="Decline" cls="btn-red" done={load} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** One button = one small form, so the right answer is always sent. */
function Answer({ fields, label, cls, done }: { fields: Record<string, string | number>; label: string; cls: string; done: () => void }) {
  return (
    <form action={async (f) => { await approveEntry(f); done(); }}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button className={`btn ${cls}`}>{label}</button>
    </form>
  );
}
