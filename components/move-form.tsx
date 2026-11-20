"use client";

import { useState } from "react";
import { moveAccountAction } from "@/app/actions/settings";
import { money } from "@/lib/format";

/** Current position (Category -> Sub-category -> Account) and New position (Category -> Sub-category), then MOVE. */
export function MoveForm({ cats, subs, accs }: { cats: { id: number; name: string; balance: number }[]; subs: { id: number; name: string; category_id: number }[]; accs: { id: number; name: string; sub: number }[] }) {
  const [c1, setC1] = useState(0), [s1, setS1] = useState(0), [c2, setC2] = useState(0);
  const catSel = (v: number, set: (n: number) => void) => (
    <select value={v} onChange={(e) => set(Number(e.target.value))} className="field-input"><option value={0}>Select</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}({money(c.balance)})</option>)}</select>
  );
  return (
    <form action={moveAccountAction} className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3 p-4">
        <h2 className="text-sm font-bold tracking-wide">CURRENT POSITION OF ACCOUNT</h2>
        <label className="field"><span className="field-label">Category</span>{catSel(c1, (n) => { setC1(n); setS1(0); })}</label>
        <label className="field"><span className="field-label">Sub-Category</span>
          <select value={s1} onChange={(e) => setS1(Number(e.target.value))} className="field-input"><option value={0}>Select</option>{subs.filter((s) => s.category_id === c1).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="field"><span className="field-label">Account Title</span>
          <select name="account" defaultValue="" className="field-input"><option value="">Select</option>{accs.filter((a) => a.sub === s1).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      </div>
      <div className="card space-y-3 p-4">
        <h2 className="text-sm font-bold tracking-wide">MOVE ACCOUNT TO NEW POSITION</h2>
        <label className="field"><span className="field-label">Category</span>{catSel(c2, setC2)}</label>
        <label className="field"><span className="field-label">Sub-Category</span>
          <select name="sub" defaultValue="" className="field-input"><option value="">Select</option>{subs.filter((s) => s.category_id === c2).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <div className="text-right"><button className="btn btn-green">Move</button></div>
      </div>
    </form>
  );
}
