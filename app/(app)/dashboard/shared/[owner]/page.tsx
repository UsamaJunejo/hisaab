import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { moneyTile } from "@/lib/format";
import { Page } from "@/components/page";
import { DashBody, RangeLine } from "@/components/dash";

/** The accounts one person shared with you. */
export default async function SharedOwner({ params }: { params: Promise<{ owner: string }> }) {
  const u = await requireUser();
  const d = await db();
  const owner = Number((await params).owner);
  const r = await pageRange("all");
  const f = await getFilter();
  const [from, to] = r.from && r.to ? [r.from, r.to] : await B.entryDates(d, u.id);
  const accs = (await B.sharedWithMe(d, u.id, r)).filter((s) => s.owner_id === owner);
  if (!accs.length) notFound();
  const total = accs.reduce((s, x) => s + x.balance, 0);
  return (
    <Page title={<>{accs[0].owner} <span className="num font-light">{moneyTile(total)}</span></>} level={u.level} rail={{ level: "LEVEL 3", search: true, filter: { back: `/dashboard/shared/${owner}`, current: f } }}>
      <RangeLine from={from} to={to} f={u.date_format} />
      <DashBody tiles={accs.map((a) => ({ key: `a${a.account_id}`, href: `/account/${a.account_id}`, name: a.name, color: a.color, icon: a.icon, balance: a.balance }))} />
    </Page>
  );
}
