import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";
import { PortalNav } from "@/components/portal-nav";

export const metadata = { title: "Business Module" };

export default async function Business() {
  const u = await requireUser();
  return (
    <Page title="Business Module" level={u.level} rail={{}}>
      <PortalNav />
      <div className="card max-w-2xl space-y-2 p-6">
        <p className="font-semibold">The Business Module is a separate product for running a business (for example a restaurant or shop): sales, stock and staff.</p>
        <p className="text-sm text-muted">Your PAYABLES and RECEIVABLES categories are kept ready for it. It isn&apos;t switched on for this account.</p>
      </div>
    </Page>
  );
}
