"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: [string, string][] = [
  ["/dashboard", "DASHBOARD"], ["/portal/profile", "PROFILE"], ["/portal/data", "DATA SPACE"], ["/portal/billing", "BILLING INFO"],
  ["/portal/invitations", "INVITATIONS"], ["/portal/invoices", "INVOICES"], ["/portal/funds", "FUNDS"],
];

export function PortalNav() {
  const path = usePathname();
  return (
    <nav aria-label="My Account" className="card mb-4 flex flex-wrap gap-1 p-1.5">
      {ITEMS.map(([h, l]) => <Link key={h} href={h} aria-current={path === h ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${path === h ? "bg-navy text-white" : "hover:bg-page"}`}>{l}</Link>)}
    </nav>
  );
}
