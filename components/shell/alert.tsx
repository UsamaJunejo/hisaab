"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** MunshiBaba-style message box: "INFO:" (or "ALERT!") with the message and an OK button. Reads ?ok= / ?error=. */
export function AlertBox() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [msg, setMsg] = useState<{ title: string; text: string } | null>(null);
  useEffect(() => {
    const ok = sp.get("ok"), err = sp.get("error");
    if (ok || err) {
      setMsg({ title: err ? "ALERT!" : "INFO:", text: (err || ok)! });
      const rest = new URLSearchParams(sp);
      rest.delete("ok"); rest.delete("error"); rest.delete("n");
      router.replace(path + (rest.size ? "?" + rest : ""), { scroll: false });
    }
  }, [sp, router, path]);
  useEffect(() => {
    const show = (e: Event) => setMsg((e as CustomEvent<{ title: string; text: string }>).detail);
    window.addEventListener("hs-alert", show);
    return () => window.removeEventListener("hs-alert", show);
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-navy/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="hs-alert-t">
      <div className="card w-full max-w-sm p-5">
        <h2 id="hs-alert-t" className={`mb-2 text-sm font-bold tracking-wide ${msg.title === "ALERT!" ? "text-red" : "text-blue"}`}>{msg.title}</h2>
        <p className="mb-4 text-[0.95rem]">{msg.text}</p>
        <div className="text-right"><button autoFocus onClick={() => setMsg(null)} className="btn btn-blue">OK</button></div>
      </div>
    </div>
  );
}

export const showAlert = (text: string, title = "INFO:") => window.dispatchEvent(new CustomEvent("hs-alert", { detail: { title, text } }));
