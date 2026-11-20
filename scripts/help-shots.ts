/**
 * Makes the pictures for the HELP slide-show (public/help/...) and the positions of the numbered marks
 * (public/help/marks.json), from a running copy of Hisaab filled with sample data.
 *
 *   node --experimental-strip-types scripts/help-shots.ts seed ./data/help-demo     # sample data
 *   PGLITE_DIR=./data/help-demo SESSION_SECRET=... npx next start -p 3200            # run it
 *   node --experimental-strip-types scripts/help-shots.ts shoot http://localhost:3200
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { SLIDES } from "../lib/help.ts";

const [mode, arg] = process.argv.slice(2);
const PASSWORD = "help-demo-1234";
const email = (level: number) => `level${level}@help.demo`;

if (mode === "seed") {
  const bcrypt = (await import("bcryptjs")).default;
  const { openPglite } = await import("../lib/db.ts");
  const B = await import("../lib/books.ts");
  const S = await import("../lib/share.ts");
  const { saveBudget } = await import("../lib/budget.ts");
  const d = await openPglite(arg);
  const hash = await bcrypt.hash(PASSWORD, 10);
  const friend = await B.createUser(d, { name: "Sara Khan", email: "sara@help.demo", phone: "03007654321", passwordHash: hash });
  const fid = async (n: string) => (await B.accountBalances(d, friend)).find((a) => a.name === n)!.id;
  await B.addEntry(d, friend, { vtype: "R", date: "2026-11-01", amount: 50000_00, fromId: await fid("CAPITAL"), toId: await fid("CASH"), note: "Opening cash" });
  for (const level of [3, 2, 1] as const) {
    const me = await B.createUser(d, { name: "Ali Raza", email: email(level), phone: `0300111222${level}`, passwordHash: hash, level });
    const id = async (n: string) => (await B.accountBalances(d, me)).find((a) => a.name === n)!.id;
    const E = async (vtype: "P" | "R", date: string, amt: number, from: string, to: string, note: string, extra = {}) =>
      B.addEntry(d, me, { vtype, date, amount: amt * 100, fromId: await id(from), toId: await id(to), note, ...extra });
    await E("R", "2026-07-01", 500000, "CAPITAL", "CASH", "Opening cash");
    await E("P", "2026-09-03", 200000, "CASH", "BANK ACCOUNT", "Deposit");
    await E("P", "2026-10-05", 4500, "CASH", "ELECTRICITY", "October bill");
    await E("P", "2026-11-02", 3200, "BANK ACCOUNT", "GAS", "Gas bill", { highlight: "#fff8dc" });
    await E("R", "2026-11-04", 150000, "SALARY", "BANK ACCOUNT", "November salary");
    await E("P", "2026-11-05", 12500, "CASH", "GROCERY", "Monthly grocery");
    await E("P", "2026-11-06", 28000, "BANK ACCOUNT", "CASH", "USD purchase", { currency: "USD", foreignAmount: 10000, rate: 280 });
    await E("P", "2026-11-08", 6000, "CASH", "FUEL", "Fuel");
    await saveBudget(d, me, { accountId: await id("ELECTRICITY"), amount: 10000_00, from: "2026-11-01", to: "2026-11-30" });
    await S.shareAccounts(d, friend, me, [{ accountId: await fid("CASH"), permission: "write", transfer: true }]);
    const [sh] = await d.q<{ id: number }>("SELECT id FROM shares WHERE shared_with = $1", [me]);
    await S.answerShare(d, me, sh.id, true);
    await S.shareAccounts(d, me, friend, [{ accountId: await id("BANK ACCOUNT"), permission: "read", transfer: false }]);
  }
  console.log("seeded", arg);
  process.exit(0);
}

if (mode === "shoot") {
  const { chromium } = createRequire(import.meta.url)("playwright");
  const base = arg.replace(/\/$/, "");
  const browser = await chromium.launch();
  const marks: Record<string, [number, number][]> = {};
  const opts = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
  const save = async (page: any, name: string) => {
    mkdirSync(`public/help/${name.split("/")[0]}`, { recursive: true });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `public/help/${name}.jpg`, type: "jpeg", quality: 72, fullPage: true });
    console.log("saved", name);
  };
  // Signed out: sign up and log in
  {
    const page = await (await browser.newContext(opts)).newPage();
    await page.goto(`${base}/signup`); await save(page, "common/signup");
    await page.goto(`${base}/login`); await save(page, "common/login");
  }
  for (const level of [3, 2, 1]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on("dialog", (dlg: any) => dlg.dismiss());
    await page.goto(`${base}/login`);
    await page.fill("[name=username]", email(level));
    await page.fill("[name=password]", PASSWORD);
    await Promise.all([page.waitForURL(/dashboard/), page.click("form button.btn-orange")]);
    // Dashboard, and where each numbered mark goes (centre of the part, as % of the picture)
    await page.goto(`${base}/dashboard`);
    await save(page, `l${level}/dashboard`);
    const size = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
    const parts = ["menu", "badge", "system", "range", "tiles", "add", "bottom", "charts", "rail", "profile"];
    marks[`l${level}/dashboard`] = await page.evaluate(([ps, w, h]: [string[], number, number]) => ps.map((p) => {
      const el = document.querySelector(`[data-help="${p}"]`);
      if (!el) return [-1, -1];
      const r = el.getBoundingClientRect();
      const x = p === "rail" ? r.left + r.width / 2 : p === "tiles" || p === "bottom" ? r.left + Math.min(r.width, 240) / 2 : r.left + Math.min(r.width, 160) / 2;
      const y = p === "rail" ? r.top + 260 : r.top + Math.min(r.height, 80) / 2;
      return [Math.round((x + scrollX) / w * 1000) / 10, Math.round((y + scrollY) / h * 1000) / 10];
    }), [parts, size[0], size[1]]);
    // Inside a tile
    const target = level === 3 ? "BANK" : level === 2 ? "MY BANK" : "BANK ACCOUNT";
    const href = await page.$$eval("a", (as: HTMLAnchorElement[], t: string) => (as.find((a) => a.innerText.split("\n").some((l) => l.trim() === t)) || {} as HTMLAnchorElement).href, target);
    if (href) { await page.goto(href); await save(page, `l${level}/inside`); }
    // Add pop-up
    await page.goto(`${base}/dashboard`);
    await page.click('[data-help="add"]');
    await save(page, `l${level}/add`);
    await page.goto(`${base}/reports/net-worth`); await save(page, `l${level}/networth`);
    if (level === 3) {
      for (const s of SLIDES.filter((x) => x.shot.startsWith("common/") && x.route && !["/signup", "/login"].includes(x.route))) {
        if (s.route === "ledger") {
          await page.goto(`${base}/dashboard`);
          const accs = await page.$$eval("a[href^='/account/']", (as: HTMLAnchorElement[]) => as.map((a) => a.href));
          await page.goto(`${base}/reports/group-ledger`);
          const bank = await page.$$eval("a", (as: HTMLAnchorElement[]) => (as.find((a) => a.innerText.trim() === "BANK ACCOUNT") || {} as HTMLAnchorElement).href);
          await page.goto(bank || accs[0]);
        } else await page.goto(`${base}${s.route}`);
        await save(page, s.shot);
      }
    }
    await ctx.close();
  }
  writeFileSync("public/help/marks.json", JSON.stringify(marks, null, 1));
  await browser.close();
  process.exit(0);
}

console.log("usage: help-shots.ts seed <dir> | shoot <base-url>");
