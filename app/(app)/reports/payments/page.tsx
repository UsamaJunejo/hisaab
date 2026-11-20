import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vouchers } from "@/lib/books";
import { getFilter, pageRange } from "@/lib/filter";
import { Page } from "@/components/page";
import { VoucherHistory } from "@/components/voucher-history";

export const metadata = { title: "Payment History" };

export default async function History({ searchParams }: { searchParams: Promise<{ page?: string; size?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const size = [25, 50, 100, 150, 200, 250].includes(Number(sp.size)) ? Number(sp.size) : 25;
  const page = Math.max(1, Number(sp.page) || 1);
  const r = await pageRange("month");
  const rows = await vouchers(await db(), u.id, "P", r);
  return (
    <Page title="Payment History" level={u.level} rail={{ search: true, filter: { back: "/reports/payments", current: await getFilter() } }}>
      <VoucherHistory u={u} kind="P" rows={rows} range={r} size={size} page={page} />
    </Page>
  );
}
