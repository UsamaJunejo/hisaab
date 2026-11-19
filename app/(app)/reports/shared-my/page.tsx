import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupLedger } from "@/lib/reports";
import { Page } from "@/components/page";
import { GroupLedger } from "@/components/group-ledger";

export const metadata = { title: "Shared Ledger (My)" };

export default async function Report({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const u = await requireUser();
  const sort = (await searchParams).sort ?? "az";
  const rows = await groupLedger(await db(), u.id, "shared-my", sort);
  return (
    <Page title="Shared Ledger (My)" level={u.level} rail={{ search: true }}>
      <GroupLedger rows={rows} tab="shared-my" sort={sort} back="/reports/shared-my" />
    </Page>
  );
}
