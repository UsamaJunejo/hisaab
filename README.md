# Hisaab

A modern rebuild of the MunshiBaba personal accounting system. It has the same screens, layout and rules, with a clean, modern look and the known MunshiBaba bugs fixed.

Built with Next.js 15, React 19, Tailwind 4 and Postgres. It runs with no setup locally, using a built-in database.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000, data kept in ./data/pglite
npm test         # 6 test files covering the books, reports, sharing and billing
```

The first person to sign up becomes the admin, which gives them access to the CEO Dashboard.

## Deploy (its own database, separate from FinanceChachu)

1. Create a **new** Supabase project (or any Postgres). Copy its connection string (pooler, port 6543).
2. Create a **new** Vercel project from this repo. Set these environment variables:
   - `DATABASE_URL`: the new connection string. Tables are created on first start.
   - `SESSION_SECRET`: any long random text (32+ characters).
   - Optional `RESEND_API_KEY` and `MAIL_FROM`: needed for emailing statements. Without them, the Share button says email isn't set up.
3. Deploy. Sign up first, so that you become the admin.

## What is the same as MunshiBaba

The full feature list is in `docs/` of the FinanceChachu repo (`munshibaba-how-it-works.md`). Hisaab follows it screen by screen:

- **Shell**:
  - navy top bar with the profile menu and the bell (Transactions / Activity / Alerts);
  - an icon menu row with a live clock: Dashboard, Voucher, Reports, Move Account, Settings, Share Account, Send Invitation, Support;
  - the grey right rail: level, Back, Search, Add, Date filter, Help.
- **1 / 2 / 3 level systems**:
  - Category → Sub-category → Account;
  - tiles with colour, icon and balance (negatives in brackets) and an edit pencil;
  - the ADD tile;
  - the PAYABLES / RECEIVABLES row;
  - the SHARED / PAYMENTS / RECEIPTS row;
  - a doughnut and a bar chart;
  - the orange badge with the sum of all balances, which is always 0.00.
- **Balances**: money in minus money out, no flipping by nature.
- **Voucher**:
  - Payment / Receipt;
  - base currency plus any of 148 currencies, with a two-way rate you can edit;
  - From / To pickers that are searchable and grouped by level;
  - date, 19 highlight colours, notes, and up to 5 attachments (pictures shrunk to 1000 px, PDFs);
  - Print, Reset, Save / Update;
  - last month's history with edit, delete and a printable voucher.
- **Account ledger**:
  - header card with PDF / Excel / Share / Print, print date, currency and page size;
  - Account / Budget / Date boxes;
  - running balance, TOTAL and OPENING;
  - a status history per entry and attachments;
  - transfer for shared entries;
  - entries waiting for approval listed separately.
- **Reports**:
  - Group Ledger, Shared Ledger (My / Others), Currency Ledger, Shared Transactions;
  - Attachments, Net Worth (per level), Full Statement;
  - Balance Sheet (check total 0.00, CROSS SHARED), Income Statement (NET PROFIT / NET LOSS);
  - Deleted Transactions Log, Payment / Receipt History.
- **Global date filter**: All time, Today, This month, Last 30 days, 4 / 6 / 12 months, or custom. Once set, it applies everywhere.
- **Sharing**:
  - search for a person (4+ characters);
  - category → sub-category → accounts, each with Share, Read only / Read & Write, and Transfer Enable;
  - the receiver accepts;
  - their entries need the owner's approval;
  - approve or reject from the bell.
- **Settings**: language, currency, date format and 24-hour clock, shared accounts, next of kin, projects, move accounts, switch level, budgets, download data (Excel with 3 sheets, or CSV), group license, reset account.
- **My Account**: profile (picture, name, email, country, cell, date of birth, search visibility, password, M-PIN), Data Space, Billing Info, Invitations, Invoices, Funds, Business Module.
- **Plans**: Free 14 days with 25 MB, USD 1 a month, USD 10 a year with 100 MB. When the plan ends or space runs out, Voucher, Reports and Share are locked behind the pay pop-up. Referral reward is 20%.
- **Support**: Help (per level), FAQs, Report an Issue. The CEO Dashboard is for the admin.

## Where it differs on purpose (bugs fixed)

| MunshiBaba | Hisaab |
|---|---|
| Group Ledger labels Receipts / Payments the opposite way to the account ledger | Both use Receipts = money in, Payments = money out |
| From and To can be the same account; zero or negative amounts are allowed | Both are refused |
| Attachments upload before the entry is saved (orphan files) | Uploaded together with the save |
| A "[" or an apostrophe in a note breaks editing or saving | Notes are stored safely |
| Deleted entries can't be restored | A Restore button in the Deleted Transactions Log |
| Spelling mistakes ("RECIEPTS", "Serach", "formate"…) | Corrected |
| Notifications are checked every 3 seconds | Every 15 seconds |
| Projects aren't connected to anything | Kept as a simple list, the same as MunshiBaba |

## Where it differs because there is no email or card service yet

| MunshiBaba | Hisaab |
|---|---|
| Switching level and resetting the account need an email link | You type SWITCH or RESET to confirm |
| Sharing is accepted from an email | Accepted from the bell (Activity tab) |
| Card / JazzCash payments | "Add Funds" sends a request; the admin confirms it in the CEO Dashboard; invoices are paid from Funds |
| Forgot-password email | A reset link is made; with no email service it is written to the server log |
| Next-of-kin reminder emails | The settings are saved; the emails need an email service and a daily job (not set up yet) |

## Technical

- `lib/books.ts`: users, the chart of accounts, entries, balances, ledger, date filter.
- `lib/reports.ts`: Group Ledger, account tree, net worth, profit / loss, currency, attachments, deleted log.
- `lib/share.ts`: sharing, approvals, transfer, notifications.
- `lib/billing.ts`: invoices, funds, referrals, admin.
- `lib/account.ts`: settings, profile, next of kin, projects, invitations, licenses.
- Money is stored in whole paisa / cents.
- Every entry is one row with From and To accounts, so all balances always sum to zero.
