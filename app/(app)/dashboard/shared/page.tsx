import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { moneyTile } from "@/lib/format";
import { Page } from "@/components/page";
import { DashBody, RangeLine } from "@/components/dash";

/** SHARED: one tile per person who shared accounts with you. */
export default async function SharedPage() {
  const u = await requireUser();
  const d = await db();
  const r = await pageRange("all");
  const f = await getFilter();
  const [from, to] = r.from && r.to ? [r.from, r.to] : await B.entryDates(d, u.id);
  const shared = await B.sharedWithMe(d, u.id, r);
  const owners = [...new Map(shared.map((s) => [s.owner_id, s.owner])).entries()];
  const total = shared.reduce((s, x) => s + x.balance, 0);
  return (
    <Page title={<>Shared <span className="num font-light">{moneyTile(total)}</span></>} level={u.level} rail={{ level: "LEVEL 2", search: true, filter: { back: "/dashboard/shared", current: f } }}>
      <RangeLine from={from} to={to} f={u.date_format} />
      {owners.length === 0 && <p className="card p-6 text-center text-muted">No account has been shared with you yet. When someone shares an account and you accept it, it appears here.</p>}
      <DashBody tiles={owners.map(([id, name]) => ({ key: `o${id}`, href: `/dashboard/shared/${id}`, name, color: "#E12428", icon: "person", balance: shared.filter((s) => s.owner_id === id).reduce((t, s) => t + s.balance, 0) }))} />
    </Page>
  );
}
