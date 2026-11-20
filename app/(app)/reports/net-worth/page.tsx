import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { netWorth, tree } from "@/lib/reports";
import { money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ShowAllBlack } from "@/components/show-all-black";

export const metadata = { title: "Net Worth" };

/** NET WORTH as of today = Assets + Liabilities. Details by category (3 levels), sub-category (2) or account (1). */
export default async function NetWorth() {
  const u = await requireUser();
  const t = await tree(await db(), u.id, { from: null, to: today() });
  const worth = netWorth(t);
  const rows = u.level === 3 ? t.map((c) => ({ key: `c${c.id}`, name: c.name, balance: c.balance, href: c.id > 0 ? `/dashboard/c/${c.id}` : "/dashboard/shared" }))
    : u.level === 2 ? t.flatMap((c) => c.subs.map((s) => ({ key: `s${s.id}`, name: s.name, balance: s.balance, href: s.id > 0 ? `/dashboard/s/${s.id}` : `/dashboard/shared/${-s.id}` })))
    : t.flatMap((c) => c.subs.flatMap((s) => s.accounts.map((a) => ({ key: `a${a.id}-${s.id}`, name: a.name, balance: a.balance, href: `/account/${a.id}` })))).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Page title="Net Worth" level={u.level} rail={{ search: true }}>
      <div className="card mb-4 p-6 text-center">
        <p className="num text-sm text-muted">{today()}</p>
        <p className={`num text-4xl font-light ${worth < 0 ? "text-red" : ""}`}>{u.currency} {money(worth)}</p>
      </div>
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold tracking-wide">DETAILS</h2>{u.level === 1 && <ShowAllBlack />}</div>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.key} data-search={r.name} className="flex justify-between py-2.5">
              <Link href={r.href} className="font-medium uppercase hover:underline">{r.name}</Link>
              <span className={`num ${r.balance < 0 ? "worth-neg text-red" : ""}`}>{money(r.balance)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Page>
  );
}
