import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { moneyTile } from "@/lib/format";
import { Page } from "@/components/page";
import { DashBody, RangeLine } from "@/components/dash";

/** Level 2: the sub-categories of one category. */
export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const d = await db();
  const id = Number((await params).id);
  const cat = await B.getCategory(d, u.id, id);
  if (!cat) notFound();
  const r = await pageRange("all");
  const f = await getFilter();
  const [from, to] = r.from && r.to ? [r.from, r.to] : await B.entryDates(d, u.id);
  const subs = await B.subcategories(d, u.id, r, id);
  const back = `/dashboard/c/${id}`;
  const total = subs.reduce((s, x) => s + x.balance, 0);
  const add = { label: `Add ${cat.name}`, spec: { level: "sub" as const, op: "add" as const, parent: id, back } };
  return (
    <Page title={cat.name} badge={moneyTile(total)} level={u.level}
      rail={{ level: "LEVEL 2", search: true, add: { ...add.spec, label: "Add New Sub Category" }, filter: { back, current: f } }}>
      <RangeLine from={from} to={to} f={u.date_format} />
      <DashBody add={add} tiles={subs.map((s) => ({
        key: `s${s.id}`, href: `/dashboard/s/${s.id}`, name: s.name, color: s.color, icon: s.icon, balance: s.balance,
        edit: { level: "sub", op: "edit", id: s.id, name: s.name, color: s.color, icon: s.icon, back },
      }))} />
    </Page>
  );
}
