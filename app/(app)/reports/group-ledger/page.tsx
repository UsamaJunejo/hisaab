import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupLedger } from "@/lib/reports";
import { Page } from "@/components/page";
import { GroupLedger } from "@/components/group-ledger";

export const metadata = { title: "Group Ledger" };

export default async function Report({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const u = await requireUser();
  const sort = (await searchParams).sort ?? "az";
  const rows = await groupLedger(await db(), u.id, "my", sort);
  return (
    <Page title="Group Ledger" level={u.level} rail={{ search: true }}>
      <GroupLedger rows={rows} tab="my" sort={sort} back="/reports/group-ledger" />
    </Page>
  );
}
