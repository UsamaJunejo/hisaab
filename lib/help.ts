/** The HELP slide-show: the same sections as MunshiBaba's "How to use" slides, with real Hisaab screenshots.
 *  `shot` names the picture in public/help/: "l3/dashboard" is per level ("l{n}/..."); "common/..." is the same for every level.
 *  The pictures are made by scripts/help-shots.ts (it also records where the numbered marks go). */
export type Slide = { key: string; section: string; title: string; shot: string; text: string[]; route?: string; perLevel?: boolean; marks?: string[] };

const SECTIONS = { start: "Create new account & login", system: "Level system", how: "How to use", reports: "Reports" } as const;

export const SLIDES: Slide[] = [
  { key: "signup", section: SECTIONS.start, title: "Create a new account", shot: "common/signup", route: "/signup",
    text: ["Enter your name, email, country, cell number and a password.", "Pick a package: Free for 14 days, Personal (monthly or yearly) or Group.", "Choose your accounting system: 1, 2 or 3 levels. You can change it later in Settings.", "Accept the terms and press Sign up."] },
  { key: "login", section: SECTIONS.start, title: "Log in", shot: "common/login", route: "/login",
    text: ["Enter your email (or cell number) and password and press Sign in.", "Forgot your password? Press Forgot Password and follow the link."] },
  { key: "account", section: SECTIONS.start, title: "My Account", shot: "common/profile", route: "/portal/profile",
    text: ["Press your picture at the top right, then My Account.", "Update your profile and picture, change your password and set your 4-digit M-PIN.", "The menu also has Data Space, Billing Info, Invitations, Invoices and Funds."] },
  { key: "invoices", section: SECTIONS.start, title: "Check invoices & paid invoices", shot: "common/invoices", route: "/portal/invoices",
    text: ["Your current invoice is at the top, with every past invoice below.", "Renew or upgrade here, and pay from your Funds."] },

  { key: "about", section: SECTIONS.system, title: "About your level system", shot: "l/dashboard", route: "/dashboard", perLevel: true,
    text: ["1 level: just accounts.", "2 levels: categories, then accounts.", "3 levels: categories, then sub-categories, then accounts.", "Your system is shown at the top right of every screen."] },
  { key: "dashboard", section: SECTIONS.system, title: "Dashboard view", shot: "l/dashboard", route: "/dashboard", perLevel: true,
    marks: ["Menu: Dashboard, Voucher, Reports, Move Account, Settings, Share Account, Send Invitation, Support", "Total of your tiles (normally 0.00)", "Your level system", "Dates covered (first entry to today, or your date filter)", "Your tiles: tap one to open it, the pencil edits it", "Add a new one", "Shared with you, Payments and Receipts", "Charts of the tiles", "Grey bar: Back, Search, Add, Date filter, Help", "Your picture (My Account) and the bell (notifications)"],
    text: ["Everything at a glance. The numbers below match the marks on the picture."] },
  { key: "levels", section: SECTIONS.system, title: "Opening a tile", shot: "l/inside", perLevel: true,
    text: ["Tap a tile to go one level deeper, until you reach an account's activity.", "The grey bar shows which level you are on. Use Back to go up."] },

  { key: "add", section: SECTIONS.how, title: "Add, edit & delete", shot: "l/add", perLevel: true,
    text: ["Press the ADD tile (or + in the grey bar) to add a category, sub-category or account.", "Give it a name, a colour and an icon (categories also need a nature) and press Apply.", "Press the pencil on a tile to edit or delete it. An account can only be deleted when it has no entries."] },
  { key: "voucher", section: SECTIONS.how, title: "Voucher", shot: "common/voucher", route: "/voucher",
    text: ["Choose PAYMENT or RECEIPT.", "Enter the amount (pick another currency on the right if needed), then From and To.", "Set the date, a highlight colour and a note, attach up to 5 files, and press Save.", "Last month's vouchers are listed below, with edit, delete and print."] },
  { key: "ledger", section: SECTIONS.how, title: "Account activity", shot: "common/ledger", route: "ledger",
    text: ["Every entry of an account with its running balance, TOTAL and OPENING.", "Edit or delete your entries, see attachments, and set a budget.", "Save as PDF or Excel, share by email, or print."] },
  { key: "move", section: SECTIONS.how, title: "Move account", shot: "common/move", route: "/move-account",
    text: ["Pick where the account is now (category, sub-category, account), then where it should go, and press Move.", "All its entries move with it."] },
  { key: "settings", section: SECTIONS.how, title: "Settings", shot: "common/settings", route: "/settings",
    text: ["Language, currency, date format and clock, next of kin, projects, switching level, budgets, downloading your data and resetting your account."] },
  { key: "budget", section: SECTIONS.how, title: "Budget setting", shot: "common/budget", route: "/budget",
    text: ["Pick an account, the amount and the dates it covers, and press Save.", "The account's activity then shows the budget, spent and left."] },
  { key: "group", section: SECTIONS.how, title: "Group ledger", shot: "common/group-ledger", route: "/reports/group-ledger",
    text: ["All your accounts in one list with receipts, payments and balance. Sort it, search it, and tap an account to open it."] },
  { key: "invite", section: SECTIONS.how, title: "Send invitation", shot: "common/invite", route: "/invite",
    text: ["Invite a friend by name, email, country and cell number.", "You earn 20% of everything they pay, for as long as they stay subscribed."] },
  { key: "share", section: SECTIONS.how, title: "Share account", shot: "common/share", route: "/share",
    text: ["Search for the person (at least 4 characters), press ADD ACCOUNT, then choose the accounts to share: Read only or Read & Write, and Transfer if you allow it.", "They accept from their bell. Entries they add wait for your approval."] },
  { key: "nok", section: SECTIONS.how, title: "Next to kin", shot: "common/nok", route: "/next-of-kin",
    text: ["Name the person to tell if you stop using Hisaab, and choose after how long and how often they are emailed."] },

  { key: "shared-my", section: SECTIONS.reports, title: "Shared ledger (my)", shot: "common/shared-my", route: "/reports/shared-my", text: ["The accounts you have shared, with who, and their totals. Remove a sharing with the bin."] },
  { key: "shared-others", section: SECTIONS.reports, title: "Shared ledger (others)", shot: "common/shared-others", route: "/reports/shared-others", text: ["The accounts other people have shared with you."] },
  { key: "currency", section: SECTIONS.reports, title: "Currency ledger", shot: "common/currency", route: "/reports/currency", text: ["Entries made in a foreign currency, with totals in both currencies."] },
  { key: "shared-tx", section: SECTIONS.reports, title: "Shared transactions", shot: "common/shared-tx", route: "/reports/shared-transactions", text: ["Every entry in shared accounts, with its status."] },
  { key: "attachments", section: SECTIONS.reports, title: "Attachments", shot: "common/attachments", route: "/reports/attachments", text: ["How many files each account has and how much space they use. Tap an account to see them."] },
  { key: "networth", section: SECTIONS.reports, title: "Net worth", shot: "l/networth", route: "/reports/net-worth", perLevel: true, text: ["Assets minus liabilities, as of today, with the details below."] },
  { key: "full", section: SECTIONS.reports, title: "Full statement", shot: "common/full", route: "/reports/full-statement", text: ["Every category, sub-category and account for the period: the most complete report."] },
  { key: "bs", section: SECTIONS.reports, title: "Balance sheet", shot: "common/bs", route: "/reports/balance-sheet", text: ["What you own on the left, what you owe and equity on the right. The AMOUNT at the top must be 0.00."] },
  { key: "is", section: SECTIONS.reports, title: "Income statement", shot: "common/is", route: "/reports/income-statement", text: ["Income and expenses for the period, with NET PROFIT or NET LOSS."] },
];

/** The picture for a slide at a level ("l/dashboard" -> "/help/l3/dashboard.jpg"). */
export const shotUrl = (s: Slide, level: number) => `/help/${s.shot.startsWith("l/") ? `l${level}/${s.shot.slice(2)}` : s.shot}.jpg`;
