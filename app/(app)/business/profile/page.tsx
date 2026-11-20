import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses } from "@/lib/business";
import { requireBusiness } from "@/lib/biz-session";
import { COUNTRIES } from "@/lib/countries";
import { Page } from "@/components/page";
import { BizPage, BizFields } from "@/components/biz/biz-page";
import { saveBusinessAction } from "@/app/actions/business";
import type { Business } from "@/lib/business";

export const metadata = { title: "Business Profile" };

function ProfileForm({ b, currency }: { b?: Business; currency: string }) {
  const f = (name: keyof Business, label: string, type = "text") => (
    <label className="text-sm font-semibold">{label}<input name={name} type={type} defaultValue={(b?.[name] as string) ?? ""} placeholder={label} required={name === "name"} className="input mt-1" /></label>
  );
  return (
    <form action={saveBusinessAction} className="card grid gap-3 p-4 sm:grid-cols-2">
      {b && <BizFields biz={b.id} />}
      <input type="hidden" name="id" value={b?.id ?? 0} />
      {f("name", "Business Name")}{f("address", "Business Address")}{f("phone", "Business Contact #", "tel")}{f("email", "Business Email", "email")}
      {f("fax", "Business Fax #")}{f("tax_no", "TAX Registration #")}{f("website", "Business Website")}
      <label className="text-sm font-semibold">Country<select name="country" defaultValue={b?.country ?? "PK"} className="input mt-1">{COUNTRIES.map((c) => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select></label>
      <p className="text-sm sm:col-span-2"><b>Currency:</b> {currency} <span className="text-muted">(your main currency, so the business shares your books)</span></p>
      <div className="text-right sm:col-span-2"><button className="btn btn-green">{b ? "Update" : "Create Business"}</button></div>
    </form>
  );
}

/** BUSINESS PROFILE: create your business (first time), or edit it. */
export default async function BusinessProfile() {
  const u = await requireUser();
  const list = await businesses(await db(), u.id);
  if (!list.length) {
    return (
      <Page title="Business Management System" level={u.level} rail={{}}>
        <div className="card mb-4 space-y-2 p-5 text-sm">
          <p className="text-base font-bold">Run your shop or restaurant from Hisaab</p>
          <p>Keep products and stock, buy from vendors, sell to customers, record expenses and payments, and see stock, sales, profit and who owes what.</p>
          <p className="text-muted">Everything also goes into your own books: customers under RECEIVABLES, vendors under PAYABLES, sales under INCOME and purchases under EXPENSE.</p>
        </div>
        <ProfileForm currency={u.currency} />
      </Page>
    );
  }
  const { b } = await requireBusiness();
  return (
    <BizPage title="Business Profile" u={u} b={b} list={list}>
      <ProfileForm b={b} currency={u.currency} />
      <details className="card mt-4 p-4">
        <summary className="cursor-pointer text-sm font-semibold">Add another business</summary>
        <div className="mt-3"><ProfileForm currency={u.currency} /></div>
      </details>
    </BizPage>
  );
}
