/** FREQUENTLY ASKED QUESTIONS: the same 29 questions, in the same order, as MunshiBaba's FAQ,
 *  rewritten in plain words for Hisaab. Each answer is a list of steps or short paragraphs. */
export const FAQ: [string, string[]][] = [
  ["How to create a new category?", [
    "On the Dashboard press the plus sign (ADD NEW CATEGORY, or + in the grey bar on the right).",
    "Name your category, for example Home Expense or Bank Abroad.",
    "Pick its nature: Assets, Liabilities, Equity, Expenses or Income.",
    "Pick a colour and an icon that suit it.",
    "Press Apply. The new category appears on the Dashboard.",
  ]],
  ["How to create a sub category?", [
    "On the Dashboard open the category you want the sub-category in.",
    "Press the plus sign (the ADD tile carries the category's name, for example ADD EXPENSE).",
    "Name it (for example UTILITIES inside EXPENSE) and pick a colour and an icon.",
    "Press Apply. It appears at level 2.",
  ]],
  ["How to create an account?", [
    "On the Dashboard open the sub-category you want the account in.",
    "Press the plus sign (ADD NEW ACCOUNT).",
    "Name it (for example ELECTRIC inside UTILITIES) and pick a colour and an icon.",
    "Press Apply. It appears at level 3.",
  ]],
  ["How to delete an account?", [
    "Open the account you want to delete.",
    "In its Account Activity (ledger), delete every transaction.",
    "Go back to level 3, press the pencil on that account, press Delete and confirm.",
    "Sub-categories and categories work the same way: a sub-category can only be deleted when it has no accounts, and a category only when it has no sub-categories.",
  ]],
  ["Why account is not deleted?", [
    "Because it still has transactions.",
    "Open its Account Activity and press the calendar (date filter). Choose Custom, from the date of your first entry to today.",
    "Now every transaction is listed. Delete them one by one, then delete the account from level 3.",
  ]],
  ["What is one level system?", [
    "There are no categories or sub-categories: just accounts, all in one place. An account can be for any person or purpose.",
    "You can still share accounts and use every feature.",
    "Good for simple home or shop books and for beginners. You can switch to 2 or 3 levels at any time.",
  ]],
  ["What is two level system?", [
    "You make categories, then accounts inside each category. For example the category BANK holds one account for each bank.",
    "It comes with ready-made categories such as Bank, Cash, Income and Expense. You can edit, delete or add more.",
  ]],
  ["What is three level system?", [
    "The most organised way: a category at level 1, a sub-category at level 2, then accounts at level 3.",
    "For example BANK, then the bank's name, then each account at that bank.",
    "You can switch to 2 or 1 level at any time.",
  ]],
  ["What are payments and receipts?", [
    "A PAYMENT is money you pay or deposit: a bill, a deposit into the bank, or paying back someone you owe. Choose PAYMENT in the Voucher.",
    "A RECEIPT is money you receive: income, profit, or someone paying you back. Choose RECEIPT in the Voucher, then pick the account it came FROM and the account it went TO.",
    "In an Account Activity, money going out shows under PAYMENTS and money coming in shows under RECEIPTS.",
  ]],
  ["What is a dashboard?", [
    "The Dashboard shows all your accounting at a glance.",
    "Top bar: logo, your picture (opens your name, customer number, My Account and Sign out) and the bell with your notifications (Transactions, Activity, Alerts).",
    "Menu row: time and date, Dashboard, Voucher, Reports, Move Account, Settings, Share Account, Send Invitation and Support.",
    "Then DASHBOARD with its total (0.00) and your level system, the date range (first entry to today, or the filter you chose), your categories, and tiles to add more.",
    "Below: Shared, Payments and Receipts, then a doughnut and a bar chart.",
    "Grey bar on the right: level, Back, Search, Add, the date filter and Help.",
  ]],
  ["What is a voucher?", [
    "The Voucher is where you record money. There are two kinds: Payment and Receipt.",
    "Amount: your currency is shown next to the box. To use another currency, pick it from the list on the right; its value in your currency is worked out from today's rate (you can change the rate).",
    "FROM: the account the money leaves. TO: the account it goes into. Check both carefully.",
    "Date: today unless you change it. Highlight: colours the row in reports. Notes: any memo, shown in the Account Activity.",
    "Attachment: up to five (5) pictures or PDFs of the bill or receipt.",
    "Under the form you see last month's history of that voucher type.",
  ]],
  ["What is a move account?", [
    "If you made an account in the wrong category or sub-category, Move Account moves it, with all its transactions, to the right place.",
  ]],
  ["How to move an account?", [
    "Choose MOVE ACCOUNT from the menu.",
    "On the left, choose the category the account is in now, then its sub-category, then the account.",
    "On the right, choose the category and sub-category it should move to.",
    "Press Move. The account and all its transactions move.",
  ]],
  ["How to share an account?", [
    "Choose SHARE ACCOUNT from the menu.",
    "Search for the person by name, email or cell number (at least 4 characters).",
    "Press ADD ACCOUNT next to them.",
    "Choose the category, then the sub-category, of the account you want to share.",
    "Tick Share next to the account. Choose Read only, or Read & Write (they can add entries to it). Tick Transfer Enable if they may copy entries into their own books.",
    "Press Submit. They get a notification in their bell (Activity) to accept the sharing.",
    "Once accepted, entries they add come to you for approval. Approved entries join your Account Activity; until then they wait at the bottom of it. Rejected entries are not shown.",
  ]],
  ["How to send an invitation?", [
    "Choose SEND INVITATION from the menu.",
    "Enter the person's name, email, country and cell number.",
    "Press Send.",
    "If they join and pay for a plan, you receive 20% of every payment they make, for as long as they stay subscribed.",
  ]],
  ["What is a group ledger?", [
    "All your accounts in one table: name, category, sub-category, total receipts, total payments and balance. Open it from Reports.",
  ]],
  ["What is group ledger (my)?", [
    "The accounts you have shared with other people.",
  ]],
  ["What is group ledger (others)?", [
    "The accounts other people have shared with you.",
  ]],
  ["What is currency ledger?", [
    "Every transaction you made in a foreign currency. Pick the currency from the list. It shows this month; use the date filter to see earlier ones.",
  ]],
  ["What are shared transactions?", [
    "Every transaction made in shared accounts, with its status. Open it from Reports.",
  ]],
  ["Why is dashboard level 1 / level 2 / level 3 / account activity / any report not showing actual total or right figures?", [
    "Because a date filter is on. With a filter, totals are only for that period.",
    "The filter you choose stays on everywhere until you change it. To see the full totals, open the date filter and choose ALL TIME.",
  ]],
  ["What are attachments?", [
    "Pictures or PDFs you add to a transaction in the Voucher, as proof or a reminder (up to five per transaction).",
    "You can browse all of them in Reports → Attachments.",
  ]],
  ["What is net worth?", [
    "Assets − Liabilities = Net Worth. It is what you are really worth: your bank accounts, cash and property, minus what you owe.",
  ]],
  ["What is full statement?", [
    "Every category, sub-category and account with its amount for the period. It is the most complete report and can be saved as a PDF and shared.",
  ]],
  ["What is balance sheet?", [
    "A professional statement made for you automatically from your entries.",
    "The AMOUNT at the top must be zero. That shows the books add up.",
  ]],
  ["What is cross shared?", [
    "The accounts other people have shared with you, shown in the Balance Sheet and Full Statement under CROSS SHARED (one line for each account).",
  ]],
  ["How to perform transactions in foreign currency?", [
    "Open VOUCHER.",
    "Pick the foreign currency from the list on the right, where your own currency is shown.",
    "Type the foreign amount. Its value in your currency is worked out straight away; you can change the rate by hand.",
    "Choose From and To, add a note or attachment if you like, and press Save.",
  ]],
  ["How to move transaction from one account to another?", [
    "Open the Account Activity that has the transaction.",
    "Find it, or type a word from it in Search.",
    "Press the blue pencil (Edit).",
    "The Voucher opens with that transaction. Change From or To.",
    "Press Update. The transaction moves to the other account.",
  ]],
  ["How to change system from one level system to another level system?", [
    "Open SETTINGS.",
    "Open SWITCH ACCOUNTING LEVEL. Your current system is highlighted.",
    "Pick the level you want.",
    "Type SWITCH in the box to confirm, and press Submit. (MunshiBaba asks you to confirm by email; Hisaab asks you to type SWITCH instead.)",
  ]],
];
