"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { shareSubmit } from "@/app/actions/share";

type Acc = { id: number; name: string; category: string; sub: string };

/** Category -> Sub-category -> accounts, each with [Share] [Read only | Read & Write] [Transfer Enable]. */
export function ShareChooser({ person, level, accounts, existing }: { person: { id: number; name: string }; level: 1 | 2 | 3; accounts: Acc[]; existing: { account_id: number; permission: string; transfer_enabled: boolean; status: string }[] }) {
  const cats = [...new Set(accounts.map((a) => a.category))];
  const [cat, setCat] = useState(level === 3 ? cats[0] ?? "" : "");
  const subs = [...new Set(accounts.filter((a) => !cat || a.category === cat).map((a) => a.sub))];
  const [sub, setSub] = useState("");
  const list = useMemo(() => accounts.filter((a) => (!cat || a.category === cat) && (!sub || a.sub === sub)), [accounts, cat, sub]);
  const ex = (id: number) => existing.find((e) => e.account_id === id);
  return (
    <form action={shareSubmit} className="card p-4 sm:p-5">
      <input type="hidden" name="user" value={person.id} />
      <input type="hidden" name="back" value={`/share/${person.id}`} />
      <h2 className="mb-4 text-sm font-bold tracking-wide">CHOOSE ACCOUNT FOR SHARING WITH <span className="text-orange">{person.name.toUpperCase()}</span></h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {level === 3 && (
          <label className="field"><span className="field-label">Category</span>
            <select value={cat} onChange={(e) => { setCat(e.target.value); setSub(""); }} className="field-input">{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
        )}
        {level >= 2 && (
          <label className="field"><span className="field-label">Sub Category</span>
            <select value={sub} onChange={(e) => setSub(e.target.value)} className="field-input"><option value="">All</option>{subs.map((s) => <option key={s}>{s}</option>)}</select></label>
        )}
      </div>
      <ul className="divide-y divide-line">
        {list.length === 0 && <li className="py-4 text-sm text-muted">No accounts here.</li>}
        {list.map((a) => {
          const e = ex(a.id);
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="min-w-40 flex-1 font-medium">{a.name}{e && <span className="ml-2 text-xs text-muted">({e.status === "active" ? "shared" : "waiting to accept"})</span>}</span>
              <label className="flex items-center gap-1.5"><input type="checkbox" name="share" value={a.id} defaultChecked={!!e} /> Share</label>
              <select name={`perm_${a.id}`} defaultValue={e?.permission ?? "read"} aria-label={`Permission for ${a.name}`} className="rounded-md border border-line px-2 py-1">
                <option value="read">Read only</option><option value="write">Read &amp; Write</option>
              </select>
              <label className="flex items-center gap-1.5"><input type="checkbox" name={`tr_${a.id}`} defaultChecked={e?.transfer_enabled} /> Transfer Enable</label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Read &amp; Write lets {person.name} add entries to that account; each one needs your approval. Transfer Enable lets them copy your entries into their own books.</p>
      <div className="mt-4 flex justify-end gap-2"><Link href="/share" className="btn btn-dark">Cancel</Link><button className="btn btn-green">Submit</button></div>
    </form>
  );
}
