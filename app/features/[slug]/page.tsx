import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { FEATURES } from "@/lib/site";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FEATURES.find((x) => x.slug === slug);
  return { title: f?.menu ?? "Features" };
}

/** One of the six feature pages (Simple Design, Customized system, Multi level system, Easy Transactions, Budget, Reports). */
export default async function Feature({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = FEATURES.find((x) => x.slug === slug);
  if (!f) notFound();
  return (
    <div className="min-h-dvh bg-page">
      <SiteHeader features={FEATURES.map((x) => [x.slug, x.menu])} />
      <section className="bg-navy px-4 pb-16 pt-12 text-center text-white">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight">{f.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/80">{f.tagline}</p>
        <Link href="/signup" className="btn btn-orange mt-6">Register Now</Link>
      </section>
      <section className="mx-auto -mt-8 grid max-w-5xl gap-4 px-4 pb-16 md:grid-cols-2">
        {f.blocks.map((b) => (
          <div key={b.h} className="card p-6">
            <h2 className="mb-3 text-lg font-bold">{b.h}</h2>
            <ul className="space-y-2 text-sm">{b.p.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />{x}</li>)}</ul>
          </div>
        ))}
        <div className="md:col-span-2 text-center"><Link href="/signup" className="btn btn-orange">Register Now</Link></div>
      </section>
      <SiteFooter />
    </div>
  );
}
