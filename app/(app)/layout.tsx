import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lockState } from "@/lib/plan";
import { MenuRow } from "@/components/shell/menu-row";
import { ProfileMenu } from "@/components/shell/profile-menu";
import { AlertBox } from "@/components/shell/alert";
import { Bell } from "@/components/shell/bell";
import { Paywall } from "@/components/shell/paywall";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const lock = await lockState(await db(), u);
  return (
    <>
      <header className="no-print flex h-16 items-center gap-4 bg-navy px-4 text-white shadow-md sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold tracking-tight" aria-label="Hisaab, dashboard">
          <img src="/logo.svg" alt="" className="h-8 w-8" /> hisaab<span className="text-orange">.app</span>
        </Link>
        <p className="hidden flex-1 text-center text-sm font-semibold tracking-[0.12em] md:block">PERSONAL ACCOUNTING SYSTEM</p>
        <span className="flex-1 md:hidden" />
        <ProfileMenu name={u.name} customerNo={u.customer_no} photo={u.photo_v ? `/api/photo?v=${u.photo_v}` : null} isAdmin={u.is_admin} />
        <Bell time24={u.time24} dateFormat={u.date_format} />
      </header>
      <MenuRow time24={u.time24} locked={lock !== "ok"} />
      {children}
      <Suspense><AlertBox /></Suspense>
      <Paywall reason={lock} />
    </>
  );
}
