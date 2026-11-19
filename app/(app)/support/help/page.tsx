import { requireUser } from "@/lib/auth";
import { Page } from "@/components/page";

export const metadata = { title: "Help" };

const STEPS: Record<1 | 2 | 3, [string, string][]> = {
  3: [["Dashboard", "Level 1 shows your categories as tiles, with their balance. Tap one to see its sub-categories (level 2), then its accounts (level 3), then the account's activity."],
    ["Voucher", "Record money moving From one account To another. Payment or Receipt, any currency, with a note, colour and up to 5 attachments."],
    ["Reports", "Group Ledger, Net Worth, Full Statement, Balance Sheet, Income Statement and more, all from the same entries."],
    ["Grey bar", "Back, Search, + to add a category / sub-category / account, the calendar for the date filter, and this help."],
    ["Bell", "Transactions to approve, sharing activity, and billing alerts."]],
  2: [["Dashboard", "Your groups (sub-categories) as tiles. Tap one to see its accounts, then the account's activity."], ["Voucher", "Record money From one account To another."], ["Reports", "All reports use the same entries."], ["Grey bar", "Back, Search, Add, Date filter, Help."], ["Bell", "Approvals, sharing activity, billing alerts."]],
  1: [["Dashboard", "All your accounts as tiles. Tap one to see its activity."], ["Voucher", "Record money From one account To another."], ["Reports", "All reports use the same entries."], ["Grey bar", "Back, Search, Add, Date filter, Help."], ["Bell", "Approvals, sharing activity, billing alerts."]],
};

export default async function Help() {
  const u = await requireUser();
  return (
    <Page title={`Help: ${u.level} level system`} level={u.level} rail={{}}>
      <ol className="grid gap-3 md:grid-cols-2">
        {STEPS[u.level].map(([t, d], i) => (
          <li key={t} className="card flex gap-4 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange font-bold text-white">{i + 1}</span><div><h2 className="font-bold uppercase">{t}</h2><p className="text-sm text-muted">{d}</p></div></li>
        ))}
      </ol>
      <p className="mt-4 text-sm">More answers in <a href="/support/faq" className="font-semibold text-blue underline">FAQs</a>.</p>
    </Page>
  );
}
