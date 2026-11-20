# Audit: Hisaab compared with the live MunshiBaba

**Date:** 20 Nov 2026

**How it was checked**
- I logged in to the live munshibaba.com and opened every screen: dashboard levels 1–3, voucher, ledger, all 11 reports, payment and receipt history, move account, settings, share, invite, support, CEO dashboard and the My Account portal.
- Anything that could change data was blocked, so the MunshiBaba account was **not changed**.
- I opened the same screens in Hisaab with sample data and compared them, both as screenshots and as on-screen text.
- Where the screen alone wasn't clear, I read MunshiBaba's own page code (for example, how the dashboard badge is added up).

**Result:** 27 differences were found. 25 are fixed. 2 are left on purpose, because Hisaab has no email or card service yet. A few points in the older reference file (`munshibaba-how-it-works.md`) also turned out to be wrong, and are listed at the end.

---

## Fixed

| # | Screen | MunshiBaba (live) | Hisaab before | Now |
|---|---|---|---|---|
| 1 | Dashboard badge | Adds up your own category tiles only. **SHARED is not included**, so it shows 0.00 | Included SHARED, so it showed a non-zero number when someone shared an account with you | Same as MunshiBaba (0.00) |
| 2 | Dashboard badge | Negative total in brackets | Minus sign | Brackets |
| 3 | Level 2 and 3 headers | The total sits in the orange badge: `BANK (3,471,641.00)` | Plain text next to the name | Orange badge |
| 4 | Tiles | Negative balances in brackets, normal colour | Red | Normal colour |
| 5 | Bar chart | Bars share the width evenly | Thin bars bunched to the left | Even, wide bars |
| 6 | Voucher | PRINT shows only when editing a saved entry | Greyed-out PRINT always shown | Hidden until editing |
| 7 | Voucher history | Dates as `2026.11.06`; rows not tinted | Your date format; tinted rows | Same as MunshiBaba |
| 8 | Account ledger | Row dates as `2026-11-19`, whatever your date format | Your date format | `yyyy-mm-dd` |
| 9 | Account ledger | Box labels in capitals: NAME:, BALANCE, FROM, TO | Mixed case | Capitals |
| 10 | All statements | "Print Date: 20 Nov 2026" | "20 NOV 2026" | "20 Nov 2026" |
| 11 | Payment / Receipt History | Page-size choice; three boxes (TRANSACTIONS, PAYMENTS or RECEIPTS, DATE); note shown as `note [To: CASH ]`; `yyyy-mm-dd` dates; load more | One date line; `[BANK → CASH]`; no page size | Same as MunshiBaba |
| 12 | Group Ledger | No TOTAL row | Had a TOTAL row | Removed |
| 13 | Shared Ledger (My) | Columns: SNO, ACCOUNTS, SUB CATEGORY, CATEGORY, RECEIPTS, PAYMENTS, BALANCE, DELETE | Extra SHARED WITH column and a TOTAL row | Person's name in brackets after the account; no TOTAL |
| 14 | Shared Ledger (Others) | Columns: SNO, ACCOUNTS ("Account (Owner)"), RECEIPTS, PAYMENTS, BALANCE. No delete | Extra SHARED BY and DELETE columns, plus a TOTAL row | Same as MunshiBaba |
| 15 | Currency Ledger | Laid out like an account ledger: page size; ACCOUNT and DATE boxes; columns S.NO, DATE, NARRATION (green "USD 100 / 280"), PAYMENTS, RECEIPTS, BALANCE, STATUS, EDIT, ACTION; footer rows TOTAL, TOTAL(USD), OPENING, OPENING(USD) | Separate USD columns and a RATE column; no running balance | Same as MunshiBaba |
| 16 | Shared Transactions | Sort list order: Account Name A–Z, Z–A, Low / High Balance First, Latest / Oldest Entry First | Different order and wording | Same order and wording |
| 17 | Net Worth | Date as `2026-11-20`; no explanation line | Your date format, plus an explanation | Same as MunshiBaba |
| 18 | Net Worth, Full Statement, Balance Sheet, Income Statement | **Categories and sub-categories with no accounts are left out** | Showed empty ones (e.g. PAYABLES, PRIVATE LOANS) | Left out |
| 19 | Balance Sheet | No total rows under the two sides; no note | TOTAL ASSETS and TOTAL L+E rows, a ✓ and a note | Removed |
| 20 | Income Statement | Header "NET LOSS 2,500.00" (no currency code); no note | "PKR …" plus a note | Same as MunshiBaba |
| 21 | Deleted Transactions Log | Sort list (Account Title A–Z … First Entry); columns SNO, ACCOUNTS, SUB CATEGORY, CATEGORY, RECEIPTS, PAYMENTS | No sort; extra DELETED count column | Same as MunshiBaba |
| 22 | Move Account, Settings | No extra notes; Settings shows values only for Language and Currency; **GROUP LICENSE only appears on MunshiBaba's group packages** | Extra note; extra values; Group License always shown | Same (Hisaab sells no group package, so it's hidden) |
| 23 | Sign up | After picking a package, **"Choose Accounting System": 1, 2 or 3 level** | No level choice (always 3) | Level choice added |
| 24 | My Account portal | Menu: DASHBOARD, PROFILE, DATA SPACE, BILLING INFO, INVITATIONS, INVOICES, FUNDS. No Business Module (it shows in the profile menu only for business owners). Invoice no. like `PAK-2022-0000006`; dates like `20-04-2022 1:38:46 AM` | No DASHBOARD link; Business Module always shown; numbers like `HSB-2026-0000001-708`; `2026-11-20 05:25` | Same menu; `HSB-2026-0000123`; dates in your format with time |
| 25 | FAQs | 29 questions in a fixed order | 15 merged questions | The same 29 questions, in the same order, in plain words |

## Left different on purpose

| # | Screen | MunshiBaba | Hisaab | Why |
|---|---|---|---|---|
| 26 | Funds | The portal's FUNDS menu says "This Feature Will Be Available Soon!" | Funds works: you ask to add funds, an admin confirms, and invoices are paid from Funds | There is no card or JazzCash gateway yet, so this is how plans get paid |
| 27 | CEO Dashboard | Has EMAIL CONFIRMED / NOT CONFIRMED counts | Not shown; has ISSUES REPORTED and funds waiting to be confirmed instead | Hisaab has no email confirmation yet; admins need the funds list |

Also not copied, on purpose: MunshiBaba's Move Account list includes the system "Shared" category, which makes no sense to move into. The bugs listed in the README ("Where it differs on purpose") are still fixed.

## Things that already matched

- **Dashboard:** layout, the menu row and live clock, the right rail, tiles and the PAYABLES / RECEIVABLES row, the SHARED / PAYMENTS / RECEIPTS row, the doughnut, the date line and the footer.
- **Pop-ups:** the add and edit pop-ups (name, nature, colour, icon) and the date filter (Regular list + Custom).
- **Voucher form:** fields and their order, the PAYMENT / RECEIPT tabs, the currency list, and FIVE (5) ATTACHMENTS.
- **Ledger:** columns, TOTAL / OPENING, the budget box and SET BUDGET, and the page size.
- **Reports:** Group Ledger tabs and sort list; Attachments; Full Statement and Balance Sheet trees including CROSS SHARED.
- **Other screens:** the Invite and Report an Issue screens, the CEO counters, Billing Info, Invitations, Data Space, and the Profile fields.

## Corrections to `munshibaba-how-it-works.md`

These were checked on the live site:
1. **Dashboard badge:** it adds up your own categories and leaves out SHARED. It isn't "the sum of every category including SHARED".
2. **Ledger and history dates:** they always show `yyyy-mm-dd` (voucher history `yyyy.mm.dd`), whatever date format you choose.
3. **Empty branches:** Net Worth, Full Statement, Balance Sheet and Income Statement leave out categories and sub-categories that have no accounts.
4. **Group License:** it is in Settings only for "Group Per Month / Year" packages.
5. **Funds:** the portal says it is "Available Soon". It isn't live.
6. **Sign-up:** it asks you to choose a 1, 2 or 3 level system.
7. **Shared Ledger (Others):** it has no delete column.
8. **CEO Dashboard:** it showed real site-wide numbers on the checked account, not zeros.
