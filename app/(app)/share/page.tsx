import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { searchUsers, sharingPartners } from "@/lib/share";
import { Page } from "@/components/page";

export const metadata = { title: "Share Account" };

/** USER SHARING ACCOUNT: search a person (name / email / cell, 4+ letters), see who you already share with. */
export default async function Share({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const u = await requireUser();
  const d = await db();
  const q = ((await searchParams).q ?? "").trim();
  let found: Awaited<ReturnType<typeof searchUsers>> = [];
  let err = "";
  if (q) { try { found = await searchUsers(d, u.id, q); } catch (e) { err = (e as Error).message; } }
  const partners = await sharingPartners(d, u.id);
  const person = (p: { id: number; name: string; email?: string | null; phone?: string | null }, extra?: React.ReactNode) => (
    <li key={p.id} className="card flex items-center gap-3 p-3">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy font-bold text-white">{p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>
      <div className="min-w-0 flex-1 text-sm"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-muted">{[p.email, p.phone].filter(Boolean).join(" · ")}</p>{extra}</div>
      <Link href={`/share/${p.id}`} className="btn btn-green h-9 min-h-0 px-3"><UserPlus className="h-4 w-4" />Add Account</Link>
    </li>
  );
  return (
    <Page title="User Sharing Account" level={u.level} rail={{}}>
      <form className="card mb-4 p-4">
        <label htmlFor="sh-q" className="mb-2 block text-sm font-bold tracking-wide">SEARCH ACCOUNT</label>
        <div className="flex gap-2">
          <input id="sh-q" name="q" defaultValue={q} minLength={4} required placeholder="Search by Name / Email / Cell Number" className="input" />
          <button className="btn btn-blue"><Search className="h-4 w-4" />Search</button>
        </div>
        <p className="mt-1 text-xs text-muted">Search string must be 4 (four) characters or more.</p>
        {err && <p className="mt-2 text-sm text-red">{err}</p>}
      </form>
      {q && !err && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold tracking-wide">SEARCH RESULT ( {found.length} )</h2>
          {found.length === 0 ? <p className="card p-4 text-sm text-muted">Nobody found. They may need to sign up first: use SEND INVITATION.</p> : <ul className="grid gap-2 md:grid-cols-2">{found.map((p) => person(p))}</ul>}
        </section>
      )}
      <section>
        <h2 className="mb-2 text-sm font-bold tracking-wide">USER SHARED ACCOUNT LIST ( {partners.length} )</h2>
        {partners.length === 0 ? <p className="card p-4 text-sm text-muted">You haven&apos;t shared any account yet.</p> : (
          <ul className="grid gap-2 md:grid-cols-2">{partners.map((p) => person(p, <p className="text-xs">{p.accounts} account(s){p.pending ? `, ${p.pending} waiting to accept` : ""}</p>))}</ul>
        )}
      </section>
    </Page>
  );
}
