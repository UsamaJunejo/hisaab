import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountBalances } from "@/lib/books";
import { Page } from "@/components/page";
import { ShareChooser } from "@/components/share-chooser";

/** CHOOSE ACCOUNT FOR SHARING WITH <person>: pick category, sub-category, then accounts with permission and Transfer Enable. */
export default async function ShareWith({ params }: { params: Promise<{ user: string }> }) {
  const u = await requireUser();
  const d = await db();
  const other = Number((await params).user);
  const [p] = await d.q<{ id: number; name: string }>("SELECT id, name FROM users WHERE id = $1 AND id <> $2", [other, u.id]);
  if (!p) notFound();
  const accs = await accountBalances(d, u.id);
  const existing = await d.q<{ account_id: number; permission: string; transfer_enabled: boolean; status: string }>("SELECT account_id, permission, transfer_enabled, status FROM shares WHERE owner_id = $1 AND shared_with = $2", [u.id, other]);
  return (
    <Page title="User Shared Accounts" level={u.level} rail={{}}>
      <ShareChooser person={p} level={u.level} accounts={accs.map((a) => ({ id: a.id, name: a.name, category: a.category, sub: a.sub }))} existing={existing} />
    </Page>
  );
}
