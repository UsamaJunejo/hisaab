import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { moneyTile } from "@/lib/format";
import { Page } from "@/components/page";
import { DashBody, RangeLine } from "@/components/dash";

/** Level 3: the accounts of one sub-category. */
export default async function SubPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const d = await db();
  const id = Number((await params).id);
  const sub = await B.getSub(d, u.id, id);
  if (!sub) notFound();
  const r = await pageRange("all");
  const f = await getFilter();
  const [from, to] = r.from && r.to ? [r.from, r.to] : await B.entryDates(d, u.id);
  const accs = (await B.accountBalances(d, u.id, r)).filter((a) => a.subcategory_id === id);
  const back = `/dashboard/s/${id}`;
  const total = accs.reduce((s, x) => s + x.balance, 0);
  const add = { label: "Add New Account", spec: { level: "account" as const, op: "add" as const, parent: id, back } };
  return (
    <Page title={sub.name} badge={moneyTile(total)} level={u.level}
      rail={{ level: u.level === 3 ? "LEVEL 3" : "LEVEL 2", search: true, add: { ...add.spec, label: add.label }, filter: { back, current: f } }}>
      <RangeLine from={from} to={to} f={u.date_format} />
      <DashBody add={add} tiles={accs.map((a) => ({
        key: `a${a.id}`, href: `/account/${a.id}`, name: a.name, color: a.color, icon: a.icon, balance: a.balance,
        edit: { level: "account", op: "edit", id: a.id, name: a.name, color: a.color, icon: a.icon, back },
      }))} />
    </Page>
  );
}
