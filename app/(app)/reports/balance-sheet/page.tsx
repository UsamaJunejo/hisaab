import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profitLoss, sumNature, tree } from "@/lib/reports";
import { longDate, money, today } from "@/lib/format";
import { Page } from "@/components/page";
import { ReportHeader } from "@/components/report-header";
import { StatementBoxes, TreeRows } from "@/components/report-bits";

export const metadata = { title: "Balance Sheet" };

/**
 * BALANCE SHEET as of today. Left: ASSETS (+ CROSS SHARED). Right: LIABILITIES + EQUITY, then NET PROFIT / NET LOSS.
 * AMOUNT is the check total: everything added up must be 0.00 when the books are right.
 */
export default async function BalanceSheet() {
  const u = await requireUser();
  const t = await tree(await db(), u.id, { from: null, to: today() });
  const pl = profitLoss(t);
  const check = sumNature(t, "Assets", "Liabilities", "Equity", "Expenses", "Income", "Shared");
  const left = t.filter((c) => c.nature === "Assets" || c.nature === "Shared");
  const right = t.filter((c) => c.nature === "Liabilities" || c.nature === "Equity");
  return (
    <Page title="Balance Sheet" level={u.level} rail={{ search: true }}>
      <ReportHeader u={u} share={{ kind: "balance-sheet", back: "/reports/balance-sheet" }} />
      <h2 className="mb-3 text-center text-lg font-semibold tracking-wide">BALANCE SHEET</h2>
      <StatementBoxes label="AMOUNT" amount={`${u.currency} ${money(check)}`} dates={[["DATE", longDate(today())]]} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-x-auto p-3"><table className="tbl"><thead><tr><th>Assets</th><th className="r">Balance</th></tr></thead><TreeRows cats={left} /></table></div>
        <div className="card overflow-x-auto p-3"><table className="tbl"><thead><tr><th>Liabilities + Equity</th><th className="r">Balance</th></tr></thead><TreeRows cats={right} />
          <tbody><tr className="bg-[#f4f6fa]"><td className="font-bold">{pl.label}</td><td className="r num font-bold">{money(pl.amount)}</td></tr></tbody></table></div>
      </div>
    </Page>
  );
}
