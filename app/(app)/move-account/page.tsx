import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountBalances, categories, subcategories } from "@/lib/books";
import { Page } from "@/components/page";
import { MoveForm } from "@/components/move-form";

export const metadata = { title: "Move Accounts" };

export default async function Move() {
  const u = await requireUser();
  const d = await db();
  const [cats, subs, accs] = await Promise.all([categories(d, u.id), subcategories(d, u.id), accountBalances(d, u.id)]);
  return (
    <Page title="Move Accounts" level={u.level} rail={{}}>
      <MoveForm cats={cats.map((c) => ({ id: c.id, name: c.name, balance: c.balance }))} subs={subs.map((s) => ({ id: s.id, name: s.name, category_id: s.category_id }))} accs={accs.map((a) => ({ id: a.id, name: a.name, sub: a.subcategory_id }))} />
    </Page>
  );
}
