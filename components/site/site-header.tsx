"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

/** The public menu, as on MunshiBaba: Home, About us, Features (6 pages), Easy Sharing, Pricing, Contact, Sign in / Sign up. */
export function SiteHeader({ features }: { features: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const [feat, setFeat] = useState(false);
  const link = "rounded-md px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white";
  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold"><img src="/logo.svg" alt="" className="h-8 w-8" />hisaab<span className="text-orange">.app</span></Link>
        <span className="flex-1" />
        <button className="rounded-md p-2 lg:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <nav className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-1 bg-navy p-3 lg:static lg:flex lg:flex-row lg:items-center lg:p-0`} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) { setOpen(false); setFeat(false); } }}>
          <Link href="/#home" className={link}>Home</Link>
          <Link href="/#about" className={link}>About us</Link>
          <div className="relative">
            <button className={`${link} flex w-full items-center gap-1`} aria-expanded={feat} onClick={() => setFeat(!feat)}>Features <ChevronDown className="h-4 w-4" /></button>
            {feat && (
              <div className="z-50 mt-1 grid min-w-56 rounded-lg bg-white p-1 text-ink shadow-xl lg:absolute lg:left-0">
                {features.map(([slug, label]) => <Link key={slug} href={`/features/${slug}`} className="rounded-md px-3 py-2 text-sm hover:bg-page">{label}</Link>)}
              </div>
            )}
          </div>
          <Link href="/#sharing" className={link}>Easy Sharing</Link>
          <Link href="/#pricing" className={link}>Pricing</Link>
          <Link href="/#contact" className={link}>Contact</Link>
          <Link href="/login" className="btn btn-orange h-9 min-h-0 lg:ml-2">Sign in / Sign up</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy px-4 py-8 text-center text-sm text-white/70">
      <p className="mb-2 font-semibold tracking-wide text-white">SUPPORT, SERVICES &amp; SECURITY</p>
      <p><Link href="/terms" className="underline">Terms of Use · Agreement · Privacy Policy · Refund Policy</Link></p>
      <p className="mt-2">© {new Date().getFullYear()} hisaab.app. All rights reserved.</p>
    </footer>
  );
}
