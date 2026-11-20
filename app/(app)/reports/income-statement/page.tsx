import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profitLoss, tree } from "@/lib/reports";
import { getFilter, pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { StatementBoxes, TreeRows } from "@/components/report-bits";

export const metadata = { title: "Income Statement" };

/** INCOME STATEMENT for the period: INCOME and EXPENSE trees; NET PROFIT / NET LOSS = Expenses + Income. */
export default async function IncomeStatement() {
  const u = await requireUser();
  const r = await pageRange("month");
  const t = await tree(await db(), u.id, r);
  const pl = profitLoss(t);
  return (
    <Page title="Income Statement" level={u.level} rail={{ search: true, filter: { back: "/reports/income-statement", current: await getFilter() } }}>
      <ReportHeader u={u} share={{ kind: "income-statement", back: "/reports/income-statement" }} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">INCOME STATEMENT</h2>
      <StatementBoxes label={pl.label} amount={money(pl.amount)} dates={[["FROM", r.from ? longDate(r.from) : "FIRST ENTRY"], ["TO", longDate(r.to ?? today())]]} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-x-auto p-3"><table className="tbl"><thead><tr><th>Income</th><th className="r">Balance</th></tr></thead><TreeRows cats={t.filter((c) => c.nature === "Income")} /></table></div>
        <div className="card overflow-x-auto p-3"><table className="tbl"><thead><tr><th>Expense</th><th className="r">Balance</th></tr></thead><TreeRows cats={t.filter((c) => c.nature === "Expenses")} /></table></div>
      </div>
    </Page>
  );
}
