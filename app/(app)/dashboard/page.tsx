import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as B from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { money } from "@/lib/format";
import { Page } from "@/components/page";
import { DashBody, RangeLine } from "@/components/dash";
import type { TileData } from "@/components/tiles";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const u = await requireUser();
  const d = await db();
  const r = await pageRange("all");
  const f = await getFilter();
  const [from, to] = r.from && r.to ? [r.from, r.to] : await B.entryDates(d, u.id);
  const totals = await B.dashboardTotals(d, u.id, r);
  const back = "/dashboard";
  let tiles: TileData[] = [], extra: TileData[] = [], sum = 0;
  let add;
  if (u.level === 3) {
    const cats = await B.categories(d, u.id, r);
    const tile = (c: B.Category): TileData => ({
      key: `c${c.id}`, href: `/dashboard/c/${c.id}`, name: c.name, color: c.color, icon: c.icon, balance: c.balance,
      edit: { level: "category", op: "edit", id: c.id, name: c.name, nature: c.nature, color: c.color, icon: c.icon, locked: c.kind !== "normal", back },
    });
    tiles = cats.filter((c) => c.kind === "normal").map(tile);
    extra = cats.filter((c) => c.kind !== "normal").map(tile);
    sum = cats.reduce((s, c) => s + c.balance, 0);
    add = { label: "Add New Category", spec: { level: "category" as const, op: "add" as const, back } };
  } else if (u.level === 2) {
    const subs = await B.subcategories(d, u.id, r);
    tiles = subs.map((s) => ({
      key: `s${s.id}`, href: `/dashboard/s/${s.id}`, name: s.name, color: s.color, icon: s.icon, balance: s.balance,
      edit: { level: "sub", op: "edit", id: s.id, name: s.name, color: s.color, icon: s.icon, back },
    }));
    sum = subs.reduce((s, x) => s + x.balance, 0);
    add = { label: "Add New Category", spec: { level: "sub" as const, op: "add" as const, askNature: true, back } };
  } else {
    const accs = await B.accountBalances(d, u.id, r);
    tiles = accs.map((a) => ({
      key: `a${a.id}`, href: `/account/${a.id}`, name: a.name, color: a.color, icon: a.icon, balance: a.balance,
      edit: { level: "account", op: "edit", id: a.id, name: a.name, color: a.color, icon: a.icon, back },
    }));
    sum = accs.reduce((s, x) => s + x.balance, 0);
    add = { label: "Add New Account", spec: { level: "account" as const, op: "add" as const, askNature: true, back } };
  }
  sum += totals.shared;
  const bottom: TileData[] = [
    { key: "shared", href: "/dashboard/shared", name: "SHARED", color: "#E12428", icon: "person", balance: totals.shared },
    { key: "pay", href: "/reports/payments", name: "PAYMENTS", color: "#6353A2", icon: "payment", balance: totals.payments },
    { key: "rec", href: "/reports/receipts", name: "RECEIPTS", color: "#2BB3B1", icon: "receipt", balance: totals.receipts },
  ];
  return (
    <Page
      title="Dashboard"
      badge={money(sum)}
      level={u.level}
      rail={{ level: "LEVEL 1", search: true, add: { ...add!.spec, label: add!.label }, filter: { back, current: f } }}
    >
      <RangeLine from={from} to={to} f={u.date_format} />
      <DashBody tiles={tiles} add={add} extraRow={extra} bottom={bottom} />
    </Page>
  );
}
