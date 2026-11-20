"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Paperclip, Printer, RotateCcw, Save, X } from "lucide-react";
import { saveVoucher, type VoucherState } from "@/app/actions/voucher";
import { AccountPicker, type PickItem } from "@/components/account-picker";
import { showAlert } from "@/components/shell/alert";
import { CURRENCIES } from "@/lib/currencies";

export const HIGHLIGHTS = ["#FFFFFF", "#7FFFD4", "#F0FFFF", "#FFEBCD", "#FFF8DC", "#DDBFAC", "#DDDDDD", "#FCDE96", "#EEA8BC", "#F06CA5", "#8DC19F", "#F5F5DC", "#E9967A", "#00CED1", "#BABADE", "#8BACDA", "#BBE1F3", "#FFCF31", "#C9F2C7"];

export type VoucherInit = {
  id?: number; vtype: "P" | "R"; date: string; amount?: string; fromId?: number | null; toId?: number | null; note?: string; highlight?: string | null;
  currency?: string | null; foreign?: string; rate?: string; files?: { id: number; name: string; mime: string }[];
};

/** Shrink a picture to at most 1000 x 1000 (like MunshiBaba) before upload. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, 1000 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function VoucherForm({ init, accounts, level, base, rates }: { init: VoucherInit; accounts: PickItem[]; level: 1 | 2 | 3; base: string; rates: Record<string, number> }) {
  const [state, action, pending] = useActionState<VoucherState, FormData>(saveVoucher, {});
  const [amount, setAmount] = useState(init.amount ?? "");
  const [cur, setCur] = useState(init.currency || base);
  const [foreign, setForeign] = useState(init.foreign ?? "");
  const [rate, setRate] = useState(init.rate ?? "");
  const [from, setFrom] = useState<number | null>(init.fromId ?? null);
  const [to, setTo] = useState<number | null>(init.toId ?? null);
  const [date, setDate] = useState(init.date);
  const [note, setNote] = useState(init.note ?? "");
  const [hl, setHl] = useState(init.highlight || "#FFFFFF");
  const [showHl, setShowHl] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [remove, setRemove] = useState<number[]>([]);
  const [tried, setTried] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isForeign = cur !== base;
  const kept = (init.files ?? []).filter((x) => !remove.includes(x.id));
  useEffect(() => { if (state.error) showAlert(state.error, "ALERT!"); }, [state]);
  useEffect(() => {
    // Choosing a currency fills today's rate (main currency per 1 unit); it can still be typed by hand.
    if (isForeign && !init.rate) setRate(rates[cur] ? String(Number(rates[cur].toFixed(4))) : "");
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  const num = (s: string) => Number(s.replace(/,/g, ""));
  const fromForeign = (fv: string, r = rate) => { setForeign(fv); if (num(fv) > 0 && num(r) > 0) setAmount((num(fv) * num(r)).toFixed(2)); };
  const fromBase = (bv: string) => { setAmount(bv); if (isForeign && num(bv) > 0 && num(rate) > 0) setForeign((num(bv) / num(rate)).toFixed(3)); };
  const reset = () => { setAmount(""); setForeign(""); setFrom(null); setTo(null); setNote(""); setHl("#FFFFFF"); setFiles([]); setCur(base); setTried(false); };
  const addFiles = async (list: FileList | null) => {
    const picked = [...(list ?? [])];
    for (const f of picked) {
      if (/\.(docx?|xlsx?|txt|pptx?|html?)$/i.test(f.name) || !(f.type.startsWith("image/") || f.type === "application/pdf")) return showAlert("File format not supported. Please attach pictures (JPEG, PNG) or PDF files.");
    }
    if (kept.length + files.length + picked.length > 5) return showAlert("Maximum Five (05) Attachments Allowed.");
    setFiles([...files, ...(await Promise.all(picked.map(shrink)))]);
  };
  const isPay = init.vtype === "P";
  const missing = { amount: tried && !(num(amount) > 0), from: tried && !from, to: tried && !to };
  return (
    <form
      action={(fd) => { files.forEach((f) => fd.append("files", f)); remove.forEach((r) => fd.append("remove", String(r))); return action(fd); }}
      onSubmit={(e) => { setTried(true); if (!(num(amount) > 0) || !from || !to) { e.preventDefault(); showAlert("Invalid input. Transaction Failed.", "ALERT!"); } }}
      className="card space-y-3 p-4 sm:p-5"
      style={{ background: hl !== "#FFFFFF" ? `linear-gradient(0deg, white 85%, ${hl}55)` : undefined }}
    >
      <input type="hidden" name="vtype" value={init.vtype} />
      <input type="hidden" name="id" value={init.id ?? ""} />
      <input type="hidden" name="highlight" value={hl} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="field">
          <span className="field-label">{base}</span>
          <input name="amount" inputMode="decimal" value={amount} onChange={(e) => fromBase(e.target.value)} placeholder="Enter Amount" aria-label={`Amount in ${base}`} aria-invalid={missing.amount} className="field-input num text-lg" autoFocus={!init.id} />
        </div>
        <select name="currency" value={cur} onChange={(e) => setCur(e.target.value)} className="input" aria-label="Currency">
          {CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
        </select>
      </div>
      {isForeign && (
        <div className="grid gap-3 rounded-xl bg-blue-soft p-3 sm:grid-cols-2">
          <div className="field"><span className="field-label">{cur}</span><input name="foreign" inputMode="decimal" value={foreign} onChange={(e) => fromForeign(e.target.value)} placeholder={`Amount in ${cur}`} className="field-input num" /></div>
          <div className="field"><span className="field-label">1 {cur} =</span><input name="rate" inputMode="decimal" value={rate} onChange={(e) => { setRate(e.target.value); if (num(foreign) > 0) fromForeign(foreign, e.target.value); }} placeholder="Rate" className="field-input num" /><span className="field-label min-w-0">{base}</span></div>
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="field"><span className="field-label">From</span><AccountPicker name="from" items={accounts} level={level} value={from} onChange={setFrom} showBalance={isPay} invalid={missing.from} /></div>
        <div className="field"><span className="field-label">To</span><AccountPicker name="to" items={accounts} level={level} value={to} onChange={setTo} showBalance={!isPay} invalid={missing.to} /></div>
        <div className="field"><span className="field-label">Date</span><input type="date" name="date" required value={date} onChange={(e) => setDate(e.target.value)} className="field-input" aria-label="Date" /></div>
        <div className="field relative">
          <span className="field-label">Highlight</span>
          <button type="button" onClick={() => setShowHl(!showHl)} className="flex flex-1 items-center gap-2 px-3" aria-label="Highlight colour">
            <span className="h-6 flex-1 rounded-md ring-1 ring-black/10" style={{ background: hl }} />
          </button>
          {showHl && (
            <div className="absolute right-0 top-full z-40 mt-1 grid w-64 grid-cols-6 gap-1.5 rounded-xl border border-line bg-white p-2 shadow-xl">
              {HIGHLIGHTS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => { setHl(c); setShowHl(false); }} className={`aspect-square rounded-md ring-1 ring-black/10 ${c === hl ? "ring-2 ring-ink" : ""}`} style={{ background: c }} />)}
            </div>
          )}
        </div>
      </div>
      <div className="field"><span className="field-label">Notes</span><textarea name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter note here" maxLength={1000} className="field-input resize-y" /></div>
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-blue"><Paperclip className="h-4 w-4" />Attachment</button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <p className="mt-1 text-[0.7rem] font-semibold text-muted">( FIVE (5) ATTACHMENTS ALLOWED )</p>
          <ul className="mt-1 space-y-1 text-sm">
            {kept.map((x) => <li key={x.id} className="flex items-center gap-2"><a href={`/api/attachment/${x.id}`} target="_blank" className="text-blue underline">{x.name}</a><button type="button" onClick={() => setRemove([...remove, x.id])} aria-label={`Remove ${x.name}`} className="text-red"><X className="h-4 w-4" /></button></li>)}
            {files.map((x, i) => <li key={i} className="flex items-center gap-2">{x.name}<button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${x.name}`} className="text-red"><X className="h-4 w-4" /></button></li>)}
          </ul>
        </div>
        <span className="flex-1" />
        {init.id ? <Link href={`/voucher/print/${init.id}`} target="_blank" className="btn btn-blue"><Printer className="h-4 w-4" />Print</Link> : null}
        {init.id ? <Link href={`/voucher?t=${init.vtype}`} className="btn btn-red"><RotateCcw className="h-4 w-4" />Reset</Link> : <button type="button" onClick={reset} className="btn btn-red"><RotateCcw className="h-4 w-4" />Reset</button>}
        <button className="btn btn-green min-w-28" disabled={pending}><Save className="h-4 w-4" />{pending ? "Saving…" : init.id ? "Update" : "Save"}</button>
      </div>
    </form>
  );
}
