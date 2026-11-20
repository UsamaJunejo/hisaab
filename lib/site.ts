/** Text for the public website: the same pages and sections as MunshiBaba's, written for Hisaab. */
export type FeaturePage = { slug: string; menu: string; title: string; tagline: string; blocks: { h: string; p: string[] }[] };

export const FEATURES: FeaturePage[] = [
  {
    slug: "simple-design", menu: "Simple Design", title: "Designed simple & subtle", tagline: "Hisaab is for everyone who wants their accounts straight.",
    blocks: [{ h: "Who is it for?", p: ["Heads of family and house wives.", "Students and individuals.", "Business people and professionals.", "Small, medium and large businesses.", "Groups, clubs and societies.", "Anyone who wants their accounts in order."] }],
  },
  {
    slug: "customized", menu: "Customized system", title: "Fully customized, the way you like it", tagline: "Set Hisaab up to work the way you do.",
    blocks: [
      { h: "Multi currency", p: ["Choose your own main currency.", "Record entries in any of 148 currencies, at today's rate (which you can change)."] },
      { h: "Date format", p: ["Pick DD-MM-YYYY, MM-DD-YYYY or YYYY-MM-DD and a 12 or 24 hour clock.", "Every screen follows your choice."] },
      { h: "Switch accounting level", p: ["Choose 1, 2 or 3 levels when you register, and change it any time.", "Your accounts, sub-categories and categories adjust by themselves."] },
      { h: "Download data", p: ["Download all your data any time, in Excel or CSV."] },
    ],
  },
  {
    slug: "multi-level", menu: "Multi level system", title: "Multi level accounting system", tagline: "Switch between the systems whenever you like.",
    blocks: [
      { h: "Single level", p: ["For beginners: all your accounts in one place.", "Simple to keep and easy to share with family, friends and partners."] },
      { h: "Two level", p: ["For everyday users: categories, with accounts inside each one.", "Your accounts are grouped in a more organised way."] },
      { h: "Three level", p: ["For advanced users: a category, then a sub-category, then the account.", "The best choice if you like everything in its right place."] },
    ],
  },
  {
    slug: "transactions", menu: "Easy Transactions", title: "Transactions made fast and easy", tagline: "One voucher for every payment and receipt.",
    blocks: [{ h: "Payments & receipts made easy", p: [
      "Fill a Payment or Receipt voucher in seconds: From, To and the amount.",
      "Pay in a foreign currency: Hisaab gives today's market rate, and you can change it. Both amounts show on your reports.",
      "Attach up to five (5) pictures or PDFs of bills and receipts.",
      "Highlight important entries with a colour of your choice, and add a note.",
      "Edit or delete an entry any time (and restore it from the Deleted log).",
    ] }],
  },
  {
    slug: "budget", menu: "Budget", title: "Budget at your fingertips", tagline: "Set budgets and manage your spending.",
    blocks: [
      { h: "Budget in your control", p: ["Choose the accounts to budget and the period the budget covers.", "Every account ledger shows the budget, what you have spent and what is left."] },
      { h: "Always know your limits", p: ["See budget, spent and remaining at a glance, and the history of past budgets."] },
    ],
  },
  {
    slug: "reports", menu: "Reports", title: "Built-in, most useful reports", tagline: "Every detail of your accounts, a click away.",
    blocks: [
      { h: "Ready when you need them", p: ["Save any report as a PDF or Excel file, print it, or email it."] },
      { h: "Group Ledger", p: ["Every account with its sub-category and category, receipts, payments and balance."] },
      { h: "Shared Ledgers (My / Others)", p: ["The accounts you share with others, and the ones others share with you."] },
      { h: "Currency Ledger", p: ["Every entry made in a foreign currency, in both currencies."] },
      { h: "Shared Transactions and Attachments", p: ["Every entry in shared accounts with its status, and every attached file."] },
      { h: "Net Worth, Full Statement, Balance Sheet, Income Statement", p: ["What you own minus what you owe; the whole tree of accounts; and profit or loss for any period."] },
    ],
  },
];
