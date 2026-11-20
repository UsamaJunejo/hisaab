"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Gauge, LogOut, Store, UserRound } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function ProfileMenu({ name, customerNo, photo, isAdmin }: { name: string; customerNo: string; photo: string | null; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const pic = photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold">{initials}</span>;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Your account" aria-expanded={open} className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white/15 text-white ring-2 ring-white/30">
        {pic}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl bg-white text-ink shadow-2xl">
          <div className="flex flex-col items-center gap-1 bg-navy-2 px-4 py-5 text-white">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white/15 ring-2 ring-white/40">{pic}</div>
            <p className="font-semibold">{name}</p>
            <p className="num text-xs tracking-[0.3em] text-white/70">{customerNo.split("").join(" ")}</p>
          </div>
          <div className="grid gap-1 p-2 text-sm">
            <Link href="/portal/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-page"><UserRound className="h-4 w-4" />My Account</Link>
            {isAdmin && <Link href="/ceo" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-page"><Gauge className="h-4 w-4" />CEO Dashboard</Link>}
            <Link href="/business" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-page"><Store className="h-4 w-4" />Business Module</Link>
            <form action={logout}><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red hover:bg-red-soft"><LogOut className="h-4 w-4" />Sign out</button></form>
          </div>
        </div>
      )}
    </div>
  );
}
