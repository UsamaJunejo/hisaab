import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, FileText, Layers, Receipt, Share2, Wallet } from "lucide-react";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  if (await currentUser()) redirect("/dashboard");
  const feats: [typeof Layers, string, string][] = [
    [Layers, "Multi-level system", "1, 2 or 3 levels: categories, sub-categories and accounts, your way."],
    [Receipt, "Easy transactions", "One voucher: From, To, amount. Any currency, notes, colours and up to 5 attachments."],
    [Share2, "Easy sharing", "Share an account with family or partners: read only or read & write, with approvals."],
    [Wallet, "Budget", "Set a budget on any account and see spent and left on its ledger."],
    [FileText, "Reports", "Group ledger, net worth, full statement, balance sheet and income statement."],
    [BarChart3, "Beautiful dashboard", "Coloured tiles, a doughnut and a bar chart of where your money is."],
  ];
  return (
    <div className="min-h-dvh bg-page">
      <header className="flex items-center gap-4 bg-navy px-4 py-4 text-white sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold"><img src="/logo.svg" alt="" className="h-8 w-8" />hisaab<span className="text-orange">.app</span></Link>
        <span className="flex-1" />
        <a href="#features" className="hidden text-sm sm:block">Features</a>
        <a href="#pricing" className="hidden text-sm sm:block">Pricing</a>
        <Link href="/login" className="btn btn-orange h-9 min-h-0">Sign in / Sign up</Link>
      </header>
      <section className="bg-navy px-4 pb-20 pt-12 text-center text-white sm:px-8">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">An accountant for just <span className="text-orange">USD 1 / month</span></h1>
        <p className="mx-auto mt-4 max-w-xl text-white/80">Personal and business accounts, made simple and disciplined. Try it free for 14 days.</p>
        <div className="mt-8 flex justify-center gap-3"><Link href="/signup" className="btn btn-orange">Register Now</Link><Link href="/login" className="btn btn-ghost">Sign in</Link></div>
      </section>
      <section id="features" className="mx-auto -mt-10 grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {feats.map(([I, t, d]) => <div key={t} className="card p-6"><I className="mb-3 h-8 w-8 text-orange" /><h2 className="mb-1 font-bold">{t}</h2><p className="text-sm text-muted">{d}</p></div>)}
      </section>
      <section id="pricing" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="page-title mb-6 text-center">Simple plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[["FREE", "USD 0.00", "Free for 14 days, 25 MB data", ["Multi-level accounting", "Unlimited accounts", "Easy sharing", "Multi-currency", "Budgets", "Attachments", "All reports"]],
            ["PERSONAL", "USD 1 / month", "Single user, 100 MB data / month", ["Everything in Free", "Download your data", "Reset account", "Next of kin"]],
            ["PERSONAL YEARLY", "USD 10 / year", "Save 16%", ["Everything in Personal", "Pay once a year"]]].map(([t, p, s, f]) => (
            <div key={t as string} className="card flex flex-col p-6"><p className="text-xs font-bold tracking-wide text-muted">{t}</p><p className="text-2xl font-bold">{p}</p><p className="mb-4 text-sm text-muted">{s}</p>
              <ul className="mb-6 flex-1 space-y-1 text-sm">{(f as string[]).map((x) => <li key={x}>✓ {x}</li>)}</ul><Link href="/signup" className="btn btn-orange">Register Now</Link></div>
          ))}
        </div>
      </section>
      <footer className="border-t border-line py-6 text-center text-sm text-muted"><Link href="/terms" className="underline">Terms of Use</Link> · © {new Date().getFullYear()} hisaab.app</footer>
    </div>
  );
}
