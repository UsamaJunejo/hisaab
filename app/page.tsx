import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, FileText, Layers, Receipt, Share2, ShieldCheck, Users, Wallet } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { localPricer } from "@/lib/geo";
import { FEATURES } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { ContactForm } from "@/components/site/contact-form";

/** The public home page, laid out like MunshiBaba's: hero, about, features, easy sharing, pricing, contact. */
export default async function Home() {
  if (await currentUser()) redirect("/dashboard");
  const local = await localPricer(await db());
  const price = (cents: number, per: string) => (
    <>
      <span className="text-2xl font-bold">USD {(cents / 100).toFixed(2)}</span> <span className="text-sm text-muted">/ {per}</span>
      {local && <span className="block text-sm font-semibold text-orange">about {local(cents)} / {per}</span>}
    </>
  );
  const icons = [Layers, ShieldCheck, Layers, Receipt, Wallet, FileText];
  const plans: [string, number, string, string, string[]][] = [
    ["FREE", 0, "14 days", "Begin controlling your finances: free for 14 days with 25 MB data", ["Multi-level accounting system", "Unlimited accounts", "Easy sharing of accounts", "Multi-currency", "Budgets", "Multiple attachments", "All the useful reports"]],
    ["PERSONAL", 100, "month", "For a single user, with 100 MB data a month", ["Everything in Free", "About 200,000 transactions", "Download data", "Earn 20% by inviting friends", "Reset account", "Next of kin"]],
    ["PERSONAL YEARLY", 1000, "year", "Save 16%: single user, 100 MB data", ["Everything in Personal", "Pay once a year"]],
    ["GROUP", 300, "month", "You plus 5 people, each with 100 MB data", ["Everything in Personal", "Group License: cover 5 people on one bill", "Group Per Year: USD 30"]],
  ];
  return (
    <div className="min-h-dvh scroll-smooth bg-page">
      <SiteHeader features={FEATURES.map((f) => [f.slug, f.menu])} />
      <section id="home" className="bg-navy px-4 pb-20 pt-12 text-center text-white">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">An accountant for just <span className="text-orange">USD 1 / month</span></h1>
        {local && <p className="mt-2 text-lg text-white/80">That&apos;s about <b className="text-orange">{local(100)}</b> a month</p>}
        <p className="mx-auto mt-4 max-w-xl text-white/80">The simplest accounting system ever. Try it free for 14 days.</p>
        <div className="mt-8 flex justify-center gap-3"><Link href="/signup" className="btn btn-orange">Register Now</Link><Link href="/login" className="btn btn-ghost">Sign in</Link></div>
      </section>

      <section id="about" className="mx-auto grid max-w-6xl scroll-mt-20 gap-6 px-4 py-14 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-2 text-2xl font-bold">Make your financial life simple, easy and disciplined</h2>
          <p className="text-muted">Hisaab is accounting and management software in the cloud. It works on computers, tablets and phones, and keeps track of your money and your business 24/7.</p>
        </div>
        <div className="card p-6">
          <h2 className="mb-2 text-2xl font-bold">Everything you need to manage your accounts</h2>
          <p className="text-muted">When your accounts are in order, your life is in order. Hisaab never deletes your account, and your data is kept safe and private.</p>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4">
        <h2 className="page-title mb-6 text-center">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => { const I = icons[i] ?? BarChart3; return (
            <Link key={f.slug} href={`/features/${f.slug}`} className="card p-6 transition hover:-translate-y-0.5 hover:shadow-lg"><I className="mb-3 h-8 w-8 text-orange" /><h3 className="mb-1 font-bold">{f.menu}</h3><p className="text-sm text-muted">{f.tagline}</p></Link>
          ); })}
        </div>
      </section>

      <section id="sharing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
        <div className="card grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
          <Share2 className="h-16 w-16 text-orange" />
          <div>
            <h2 className="mb-2 text-2xl font-bold">Easy sharing</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>Share any account with family, friends or business partners who use Hisaab.</li>
              <li>Choose Read only, or Read &amp; Write so they can add entries too.</li>
              <li>Nothing they add counts until you approve it. You are told about every entry in the bell.</li>
              <li>Allow Transfer so they can copy an approved entry into their own books.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-14">
        <h2 className="page-title mb-6 text-center">Simple plan</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map(([t, cents, per, sub, f]) => (
            <div key={t} className="card flex flex-col p-6">
              <p className="text-xs font-bold tracking-wide text-muted">{t}</p>
              <p className="my-1">{price(cents, per)}</p>
              <p className="mb-4 text-sm text-muted">{sub}</p>
              <ul className="mb-6 flex-1 space-y-1 text-sm">{f.map((x) => <li key={x}>✓ {x}</li>)}</ul>
              <Link href="/signup" className="btn btn-orange">Register Now</Link>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">NOTE: The amount charged is the current market exchange rate equivalent of the USD price. Your bank may charge a slightly different amount.</p>
      </section>

      <section id="contact" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16">
        <div className="card p-6">
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6 text-orange" />Contact us</h2>
          <p className="mb-4 text-sm text-muted">Questions, ideas or a business enquiry? Send us a message.</p>
          <ContactForm />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
