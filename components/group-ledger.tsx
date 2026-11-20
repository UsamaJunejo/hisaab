import Link from "next/link";
import { Trash2 } from "lucide-react";
import { money } from "@/lib/format";
import { SORTS, type GLRow, type GLTab } from "@/lib/reports";
import { QuerySelect } from "@/components/query-select";
import { ConfirmForm } from "@/components/confirm-form";
import { removeShareAction } from "@/app/actions/share";
import { GLTabs } from "@/components/report-bits";

/** Group Ledger and the two Shared Ledgers: one table of accounts with receipts (in), payments (out), balance. */
export function GroupLedger({ rows, tab, sort, back }: { rows: GLRow[]; tab: GLTab; sort: string; back: string }) {
  return (
    <>
      <GLTabs active={tab} />
      <div className="mb-3 flex justify-end"><QuerySelect name="sort" value={sort} options={SORTS} label="Sort" /></div>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S.No</th><th>Accounts</th>{tab !== "shared-others" && <><th>Sub Category</th><th>Category</th></>}<th className="r">Receipts</th><th className="r">Payments</th><th className="r">Balance</th>{tab === "shared-my" && <th className="c">Delete</th>}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted">{tab === "my" ? "No accounts yet." : tab === "shared-my" ? "You haven't shared any account. Use SHARE ACCOUNT in the menu." : "No account has been shared with you yet."}</td></tr>}
            {rows.map((r, i) => (
              <tr key={`${r.account_id}-${r.share_id ?? 0}`} data-search={`${r.name} ${r.sub} ${r.category} ${r.person ?? ""}`}>
                <td>{i + 1}.</td>
                <td><Link href={`/account/${r.account_id}`} className="font-medium hover:underline">{r.name}</Link>{r.person && <span className="text-muted"> ({r.person})</span>}</td>
                {tab !== "shared-others" && <><td>{r.sub}</td><td>{r.category}</td></>}
                <td className="r num">{money(r.receipts)}</td>
                <td className="r num">{money(r.payments)}</td>
                <td className={`r num font-semibold ${r.balance < 0 ? "text-red" : ""}`}>{money(r.balance)}</td>
                {tab === "shared-my" && r.share_id && (
                  <td className="c"><ConfirmForm action={removeShareAction} fields={{ id: r.share_id, back }} message="Delete Sharing; confirm!" className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Remove sharing" /></ConfirmForm></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
