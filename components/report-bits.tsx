import Link from "next/link";
import { money } from "@/lib/format";
import type { TreeCat } from "@/lib/reports";

/** Category (bold) -> sub-category -> account rows, each with its balance; account names open their ledger. */
export function TreeRows({ cats, link = true }: { cats: TreeCat[]; link?: boolean }) {
  return (
    <>
      {cats.map((c) => (
        <tbody key={c.id} data-search={`${c.name} ${c.subs.map((s) => `${s.name} ${s.accounts.map((a) => a.name).join(" ")}`).join(" ")}`}>
          <tr className="bg-[#f4f6fa]"><td className="font-bold uppercase">{c.name}</td><td className={`r num font-bold ${c.balance < 0 ? "text-red" : ""}`}>{money(c.balance)}</td></tr>
          {c.subs.map((s) => (
            <SubRows key={s.id} s={s} link={link} />
          ))}
        </tbody>
      ))}
    </>
  );
}

function SubRows({ s, link }: { s: TreeCat["subs"][number]; link: boolean }) {
  return (
    <>
      <tr><td className="pl-6 font-semibold">{s.name}</td><td className={`r num font-semibold ${s.balance < 0 ? "text-red" : ""}`}>{money(s.balance)}</td></tr>
      {s.accounts.map((a) => (
        <tr key={a.id}>
          <td className="pl-12">{link ? <Link href={`/account/${a.id}`} className="hover:underline">{a.name}</Link> : a.name}</td>
          <td className={`r num ${a.balance < 0 ? "text-red" : ""}`}>{money(a.balance)}</td>
        </tr>
      ))}
    </>
  );
}

/** The three boxes under a statement title: label + amount, and the dates. */
export function StatementBoxes({ label, amount, dates }: { label: string; amount: string; dates: [string, string][] }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2">
      <div className="card overflow-hidden">
        <p className="th-grey px-4 py-2 text-center">Account</p>
        <p className="flex justify-between p-3 text-sm"><b>{label}</b><span className="num font-semibold">{amount}</span></p>
      </div>
      <div className="card overflow-hidden">
        <p className="th-grey px-4 py-2 text-center">Date</p>
        <dl className="flex flex-wrap gap-x-6 p-3 text-sm">{dates.map(([k, v]) => <div key={k} className="flex gap-3"><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>)}</dl>
      </div>
    </div>
  );
}

export function GLTabs({ active }: { active: "my" | "shared-my" | "shared-others" }) {
  const t = (k: typeof active, href: string, label: string) => (
    <Link href={href} aria-current={active === k ? "page" : undefined} className={`btn ${active === k ? "btn-orange" : "btn-dark"}`}>{label}</Link>
  );
  return <div className="mb-4 flex flex-wrap gap-2">{t("my", "/reports/group-ledger", "My Accounts")}{t("shared-my", "/reports/shared-my", "Shared Accounts (My)")}{t("shared-others", "/reports/shared-others", "Shared Accounts (Others)")}</div>;
}
