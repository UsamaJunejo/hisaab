"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ChevronDown, CircleHelp, FileText, LayoutDashboard, Mail, Receipt, Settings, Share2, type LucideIcon } from "lucide-react";
import { Clock } from "./clock";

type Item = { href: string; label: string; icon: LucideIcon; match: string[]; locked?: boolean; menu?: [string, string][] };

export const REPORTS: [string, string][] = [
  ["/reports/group-ledger", "Group Ledger"],
  ["/reports/shared-my", "Shared Ledger (My)"],
  ["/reports/shared-others", "Shared Ledger (Others)"],
  ["/reports/currency", "Currency Ledger"],
  ["/reports/shared-transactions", "Shared Transactions"],
  ["/reports/attachments", "Attachments"],
  ["/reports/net-worth", "Net Worth"],
  ["/reports/full-statement", "Full Statement"],
  ["/reports/balance-sheet", "Balance Sheet"],
  ["/reports/income-statement", "Income Statement"],
  ["/reports/deleted", "Deleted Transactions Log"],
];

function Dropdown({ item, active, onPay }: { item: Item; active: boolean; onPay: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const I = item.icon;
  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => (item.locked ? onPay() : setOpen((o) => !o))}
        aria-expanded={open}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 px-2 py-2 text-[0.7rem] font-semibold tracking-wide transition-colors ${active ? "bg-white text-ink shadow-[inset_0_-3px_0_var(--color-orange)]" : "text-ink/80 hover:bg-white/70"}`}
      >
        <I className="h-6 w-6" strokeWidth={1.4} />
        <span className="flex items-center gap-0.5">{item.label}<ChevronDown className="h-3 w-3" /></span>
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-40 mt-1 w-60 -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl">
          {item.menu!.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-page">{label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MenuRow({ time24, locked }: { time24: boolean; locked: boolean }) {
  const path = usePathname();
  const items: Item[] = [
    { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard, match: ["/dashboard", "/account"] },
    { href: "/voucher", label: "VOUCHER", icon: Receipt, match: ["/voucher"], locked },
    { href: "#", label: "REPORTS", icon: FileText, match: ["/reports"], locked, menu: REPORTS },
    { href: "/move-account", label: "MOVE ACCOUNT", icon: ArrowLeftRight, match: ["/move-account"] },
    { href: "/settings", label: "SETTINGS", icon: Settings, match: ["/settings", "/budget", "/projects", "/next-of-kin", "/group-license"] },
    { href: "/share", label: "SHARE ACCOUNT", icon: Share2, match: ["/share"], locked },
    { href: "/invite", label: "SEND INVITATION", icon: Mail, match: ["/invite"] },
    { href: "#", label: "SUPPORT", icon: CircleHelp, match: ["/support"], menu: [["/support/help", "Help"], ["/support/faq", "FAQs"], ["/support/issue", "Report an Issue"]] },
  ];
  const showPay = () => window.dispatchEvent(new CustomEvent("hs-paywall"));
  return (
    <nav aria-label="Main" data-help="menu" className="no-print sticky top-0 z-30 flex h-[4.6rem] items-stretch overflow-x-auto border-b border-line bg-[#e7ebf1] pl-3">
      <Clock time24={time24} />
      {items.map((it) => {
        const active = it.match.some((m) => path.startsWith(m));
        if (it.menu) return <Dropdown key={it.label} item={it} active={active} onPay={showPay} />;
        const I = it.icon;
        const cls = `flex min-w-[6.5rem] flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[0.7rem] font-semibold tracking-wide transition-colors ${active ? "bg-white text-ink shadow-[inset_0_-3px_0_var(--color-orange)]" : "text-ink/80 hover:bg-white/70"}`;
        return it.locked ? (
          <button key={it.label} type="button" onClick={showPay} className={cls}><I className="h-6 w-6" strokeWidth={1.4} />{it.label}</button>
        ) : (
          <Link key={it.label} href={it.href} className={cls} aria-current={active ? "page" : undefined}><I className="h-6 w-6" strokeWidth={1.4} />{it.label}</Link>
        );
      })}
    </nav>
  );
}
