import Link from "next/link";
import { requireBusiness } from "@/lib/biz-session";
import { bizDashboard } from "@/lib/business";
import { pageRange } from "@/lib/filter";
import { longDate, money, today } from "@/lib/format";
import { BizPage } from "@/components/biz/biz-page";

export const metadata = { title: "Business Dashboard" };

/** The business dashboard: this period's sales, purchases and expenses, who owes what, stock, and the last 6 months. */
export default async function BizDashboard() {
  const { u, d, b, list } = await requireBusiness();
  const r = await pageRange("month");
  const s = await bizDashboard(d, u.id, b.id, r);
  const tiles: [string, number, string, string][] = [
    ["SALES", s.sales, "/business/reports/sale-invoice", "#14B14B"], ["PURCHASES", s.purchases, "/business/reports/purchase-invoice", "#EA6146"],
    ["EXPENSES", s.expenses, "/business/expense", "#92268E"], ["RECEIVABLE (customers owe)", s.receivable, "/business/reports/customer-balance", "#1E8955"],
    ["PAYABLE (you owe vendors)", s.payable, "/business/reports/vendor-balance", "#F6A523"], ["STOCK VALUE", s.stockValue, "/business/reports/stock-value", "#3B5FAB"],
  ];
  const max = Math.max(1, ...s.months.flatMap((m) => [m.sales, m.purchases]));
  return (
    <BizPage title="Dashboard" u={u} b={b} list={list} filter="/business">
      <p className="num mb-3 text-sm font-semibold">{r.from ? longDate(r.from) : "FIRST ENTRY"} to {longDate(r.to ?? today())}</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map(([l, v, h, c]) => (
          <Link key={l} href={h} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className="h-12 w-1.5 rounded-full" style={{ background: c }} />
            <span><span className="block text-xs font-semibold tracking-wide text-muted">{l}</span><span className="num text-2xl font-light">{money(v)}</span></span>
          </Link>
        ))}
      </div>
      {s.lowCount > 0 && <Link href="/business/reports/low-inventory" className="card mb-4 block border-l-4 border-red p-3 text-sm font-semibold text-red">{s.lowCount} product(s) are low on stock. See the Low Inventory Report.</Link>}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-bold tracking-wide">LAST 6 MONTHS</h2>
          {s.months.length === 0 ? <p className="text-sm text-muted">No sales or purchases yet.</p> : (
            <ul className="space-y-2 text-xs">
              {s.months.map((m) => (
                <li key={m.m} className="grid grid-cols-[4rem_1fr] items-center gap-2">
                  <span className="num font-semibold">{m.m}</span>
                  <span className="space-y-1">
                    <span className="flex items-center gap-2"><span className="h-3 rounded bg-green" style={{ width: `${(m.sales / max) * 100}%` }} /><span className="num">{money(m.sales)}</span></span>
                    <span className="flex items-center gap-2"><span className="h-3 rounded bg-orange" style={{ width: `${(m.purchases / max) * 100}%` }} /><span className="num">{money(m.purchases)}</span></span>
                  </span>
                </li>
              ))}
              <li className="flex gap-4 pt-1 text-muted"><span><span className="mr-1 inline-block h-2 w-3 rounded bg-green" />Sales</span><span><span className="mr-1 inline-block h-2 w-3 rounded bg-orange" />Purchases + expenses</span></li>
            </ul>
          )}
        </div>
        <div className="card overflow-x-auto p-4">
          <h2 className="mb-3 text-sm font-bold tracking-wide">TOP SELLING PRODUCTS</h2>
          <table className="tbl"><thead><tr><th>Product</th><th className="r">Qty</th><th className="r">Sales</th><th className="r">Profit</th></tr></thead>
            <tbody>
              {s.top.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted">No sales in this period.</td></tr>}
              {s.top.map((x) => <tr key={x.id}><td>{x.name}</td><td className="r num">{x.qty}</td><td className="r num">{money(x.sales)}</td><td className={`r num ${x.profit < 0 ? "text-red" : "text-green"}`}>{money(x.profit)}</td></tr>)}
            </tbody></table>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">Sale invoices this period: <b>{s.sale_count}</b>. Customers and vendors are also accounts in your books (RECEIVABLES and PAYABLES on your Hisaab dashboard).</p>
    </BizPage>
  );
}
