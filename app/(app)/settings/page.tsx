import Link from "next/link";
import { ArrowLeftRight, CalendarDays, ChevronRight, Coins, Download, Gauge, Languages, PieChart, RotateCcw, Share2, UsersRound, FolderKanban } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { COUNTRIES } from "@/lib/countries";
import { DATE_FORMATS } from "@/lib/format";
import { resetAccountAction, saveSettingsAction, switchLevelAction } from "@/app/actions/settings";

export const metadata = { title: "Settings" };

function Row({ icon, title, value, href, children }: { icon: React.ReactNode; title: string; value?: string; href?: string; children?: React.ReactNode }) {
  const head = <span className="flex flex-1 items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-page">{icon}</span><span className="font-semibold tracking-wide uppercase">{title}</span></span>;
  if (href) return <Link href={href} className="card flex items-center gap-2 p-4 hover:shadow-lg">{head}<span className="text-sm text-muted">{value}</span><ChevronRight className="h-4 w-4 text-muted" /></Link>;
  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4">{head}<span className="text-sm text-muted">{value}</span><ChevronRight className="h-4 w-4 text-muted transition group-open:rotate-90" /></summary>
      <div className="border-t border-line p-4">{children}</div>
    </details>
  );
}

export default async function Settings() {
  const u = await requireUser();
  const country = COUNTRIES.find((c) => c[0] === u.country);
  return (
    <Page title="Settings" level={u.level} rail={{}}>
      <div className="grid gap-3 lg:grid-cols-2">
        <form action={saveSettingsAction} id="settings" className="contents" />
        <div className="space-y-3">
          <Row icon={<Languages className="h-5 w-5 text-blue" />} title="Language" value="USA (English)"><p className="text-sm text-muted">English is the only language for now.</p></Row>
          <Row icon={<Coins className="h-5 w-5 text-orange" />} title="Currency" value={`${u.currency} (${country?.[4] ?? u.currency})`}>
            <label className="mb-1 block text-sm font-semibold" htmlFor="st-cur">Your main currency</label>
            <select id="st-cur" form="settings" name="cur_country" defaultValue={`${u.currency}|${u.country}`} className="input"
              aria-describedby="st-cur-h">
              {COUNTRIES.filter((c) => c[3]).map((c) => <option key={c[0]} value={`${c[3]}|${c[0]}`}>{c[1]} ({c[3]}) {c[4]}</option>)}
            </select>
            <p id="st-cur-h" className="mt-1 text-xs text-muted">Shown next to every amount. Amounts already entered are not converted.</p>
          </Row>
          <Row icon={<CalendarDays className="h-5 w-5 text-red" />} title="Date Format">
            <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" form="settings" name="time24" defaultChecked={u.time24} /> Use 24 Hours Format (otherwise 1:00 PM)</label>
            <label className="mb-1 block text-sm font-semibold" htmlFor="st-df">Select Date Format</label>
            <select id="st-df" form="settings" name="date_format" defaultValue={u.date_format} className="input">{DATE_FORMATS.map((f) => <option key={f}>{f}</option>)}</select>
          </Row>
          <Row icon={<Share2 className="h-5 w-5 text-green" />} title="Shared Accounts" href="/share" />
          <Row icon={<UsersRound className="h-5 w-5 text-red" />} title="Next to Kin" href="/next-of-kin" />
          <Row icon={<FolderKanban className="h-5 w-5 text-orange" />} title="Add Projects" href="/projects" />
        </div>
        <div className="space-y-3">
          <Row icon={<ArrowLeftRight className="h-5 w-5 text-red" />} title="Move Accounts" href="/move-account" />
          <Row icon={<Gauge className="h-5 w-5 text-green" />} title="Switch Accounting Level">
            <form action={switchLevelAction} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                {[1, 2, 3].map((l) => (
                  <label key={l} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-semibold ${l === u.level ? "border-orange bg-orange/10" : "border-line"}`}>
                    <input type="radio" name="level" value={l} defaultChecked={l === u.level} /> {l} LEVEL SYSTEM
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted">1 level: accounts only. 2 levels: groups and accounts. 3 levels: categories, sub-categories and accounts. Your entries stay the same.</p>
              <input name="confirm" required placeholder="Type SWITCH to confirm" className="input" aria-label="Type SWITCH to confirm" />
              <button className="btn btn-green">Submit</button>
            </form>
          </Row>
          <Row icon={<PieChart className="h-5 w-5 text-orange" />} title="Set Budget of Account" href="/budget" />
          <Row icon={<Download className="h-5 w-5 text-blue" />} title="Download Data">
            <form action="/api/export/data" method="get" className="space-y-3">
              <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="fmt" value="xls" defaultChecked /> Excel</label><label className="flex items-center gap-2"><input type="radio" name="fmt" value="csv" /> CSV</label></div>
              <select name="kind" required defaultValue="" className="input" aria-label="Select Data">
                <option value="" disabled>Select Data</option><option value="accounts">Accounts</option><option value="group">Group Ledger</option><option value="activity">Accounts Activity</option>
              </select>
              <p className="text-xs text-muted">Excel downloads one file with all three sheets; CSV downloads the one you pick.</p>
              <button className="btn btn-blue"><Download className="h-4 w-4" />Download Data</button>
            </form>
          </Row>
          {/* GROUP LICENSE: MunshiBaba shows it only on its group packages, which Hisaab does not sell. */}

          <Row icon={<RotateCcw className="h-5 w-5 text-red" />} title="Reset Account">
            <form action={resetAccountAction} className="space-y-3">
              <p className="rounded-lg bg-red-soft p-3 text-sm font-semibold text-red">PLEASE DOWNLOAD DATA BEFORE DELETING ALL YOUR TRANSACTIONS AND ACCOUNTS</p>
              <input name="confirm" required placeholder="Type RESET to confirm" className="input" aria-label="Type RESET to confirm" />
              <button className="btn btn-red">Reset</button>
            </form>
          </Row>
        </div>
      </div>
      <div className="mt-4 flex justify-end"><button form="settings" className="btn btn-green">Save Settings</button></div>
    </Page>
  );
}
