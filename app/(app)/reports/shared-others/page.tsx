import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupLedger } from "@/lib/reports";
import { Page } from "@/components/page";
import { GroupLedger } from "@/components/group-ledger";

export const metadata = { title: "Shared Ledger (Others)" };

export default async function Report({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const u = await requireUser();
  const sort = (await searchParams).sort ?? "az";
  const rows = await groupLedger(await db(), u.id, "shared-others", sort);
  return (
    <Page title="Shared Ledger (Others)" level={u.level} rail={{ search: true }}>
      <GroupLedger rows={rows} tab="shared-others" sort={sort} back="/reports/shared-others" />
    </Page>
  );
}
