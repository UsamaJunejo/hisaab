import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { netWorth, tree } from "@/lib/reports";
import { getFilter, pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { StatementBoxes, TreeRows } from "@/components/report-bits";

export const metadata = { title: "Full Statement" };

/** FULL STATEMENT: every category, sub-category and account with its movement in the period. */
export default async function FullStatement() {
  const u = await requireUser();
  const r = await pageRange("month");
  const t = await tree(await db(), u.id, r);
  return (
    <Page title="Full Statement" level={u.level} rail={{ search: true, filter: { back: "/reports/full-statement", current: await getFilter() } }}>
      <ReportHeader u={u} share={{ kind: "full-statement", back: "/reports/full-statement" }} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">FULL STATEMENT</h2>
      <StatementBoxes label="AMOUNT" amount={`${u.currency} ${money(netWorth(t))}`} dates={[["FROM", r.from ? longDate(r.from) : "FIRST ENTRY"], ["TO", longDate(r.to ?? today())]]} />
      <div className="card overflow-x-auto p-3"><table className="tbl"><thead><tr><th>Description</th><th className="r">Balance</th></tr></thead><TreeRows cats={t} /></table></div>
    </Page>
  );
}
