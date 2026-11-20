import { Page } from "@/components/page";
import { getFilter } from "@/lib/filter";
import { BizNav } from "./biz-nav";
import { selectBusinessAction } from "@/app/actions/business";
import type { Business } from "@/lib/business";

/** A Business Module screen: the business menu on the left, the screen on the right; "Select Business" when there are several. */
export async function BizPage({ title, u, b, list, children, filter }: { title: string; u: { level: 1 | 2 | 3 }; b: Business; list: Business[]; children: React.ReactNode; filter?: string }) {
  return (
    <Page title={title} level={u.level} rail={{ search: true, ...(filter ? { filter: { back: filter, current: await getFilter() } } : {}) }}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-navy px-2.5 py-1 text-xs font-bold tracking-wide text-white">BUSINESS MANAGEMENT SYSTEM</span>
        {list.length > 1 ? (
          <form action={selectBusinessAction} className="flex items-center gap-2">
            <select name="biz" defaultValue={b.id} className="input h-9 min-h-0 w-auto py-0" aria-label="Select Business">{list.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <button className="btn btn-ghost h-9 min-h-0">Select Business</button>
          </form>
        ) : <b>{b.name}</b>}
      </div>
      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <BizNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Page>
  );
}

/** Hidden fields every business form sends. */
export function BizFields({ biz, back }: { biz: number; back?: string }) {
  return <><input type="hidden" name="biz" value={biz} />{back && <input type="hidden" name="back" value={back} />}</>;
}
