"use server";

import { redirect } from "next/navigation";
import { act, int, str } from "@/lib/act";
import { moveAccount } from "@/lib/books";
import * as A from "@/lib/account";
import * as Bl from "@/lib/billing";
import { deleteBudget, saveBudget } from "@/lib/budget";
import { toPaisa } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const on = (f: FormData, k: string) => f.get(k) === "on";

export async function saveSettingsAction(f: FormData) {
  const [currency, country] = str(f, "cur_country").split("|");
  await act("/settings", (u, d) => A.saveSettings(d, u.id, { currency, country, dateFormat: str(f, "date_format"), time24: on(f, "time24") }), "Settings Updated.");
}

export async function switchLevelAction(f: FormData) {
  if (str(f, "confirm").toUpperCase() !== "SWITCH") redirect("/settings?error=" + encodeURIComponent("Type SWITCH to confirm the change of level system."));
  await act("/settings", (u, d) => A.switchLevel(d, u.id, int(f, "level")), "Your accounting level system has been changed.");
}

export async function resetAccountAction(f: FormData) {
  if (str(f, "confirm").toUpperCase() !== "RESET") redirect("/settings?error=" + encodeURIComponent("Type RESET to confirm deleting all your transactions and accounts."));
  await act("/dashboard", (u, d) => A.resetAccount(d, u.id), "Your account has been reset.");
}

export async function moveAccountAction(f: FormData) {
  await act("/move-account", (u, d) => moveAccount(d, u.id, int(f, "account"), int(f, "sub")), "Successfully Moved");
}

export async function saveBudgetAction(f: FormData) {
  await act("/budget", (u, d) => saveBudget(d, u.id, { id: int(f, "id") || undefined, accountId: int(f, "account"), amount: toPaisa(str(f, "amount")), from: str(f, "from"), to: str(f, "to") }), int(f, "id") ? "Budget Settings Updated." : "Budget Settings Saved.");
}
export async function deleteBudgetAction(f: FormData) {
  await act("/budget", (u, d) => deleteBudget(d, u.id, int(f, "id")), "Budget deleted.");
}

export async function saveProjectAction(f: FormData) {
  await act("/projects", (u, d) => A.saveProject(d, u.id, int(f, "id"), str(f, "name")), int(f, "id") ? "Project updated." : "Project saved.");
}
export async function deleteProjectAction(f: FormData) {
  await act("/projects", (u, d) => A.deleteProject(d, u.id, int(f, "id")), "Project deleted.");
}

export async function saveNokAction(f: FormData) {
  await act("/next-of-kin", (u, d) => A.saveNok(d, u.id, { name: str(f, "name"), email: str(f, "email"), phone: str(f, "phone"), after: int(f, "after"), interval: int(f, "interval"), times: int(f, "times") }), "Next of kin saved.");
}

export async function inviteAction(f: FormData) {
  await act("/invite", (u, d) => A.invite(d, u.id, { name: str(f, "name"), email: str(f, "email"), phone: str(f, "phone"), country: str(f, "country") }), "Your invitation has been sent successfully.");
}

export async function addLicenseAction(f: FormData) {
  await act("/group-license", (u, d) => A.addLicense(d, u.id, { name: str(f, "name"), email: str(f, "email"), phone: str(f, "phone") }), "License invitation saved.");
}
export async function deleteLicenseAction(f: FormData) {
  await act("/group-license", (u, d) => A.deleteLicense(d, u.id, int(f, "id")), "License removed.");
}

export async function reportIssueAction(f: FormData) {
  await act("/support/issue", (u, d) => A.reportIssue(d, u.id, str(f, "message")), "Thank you. Your issue has been sent to support.");
}

export async function saveProfileAction(f: FormData) {
  await act("/portal/profile", (u, d) => A.saveProfile(d, u.id, { name: str(f, "name"), email: str(f, "email"), phone: str(f, "phone"), country: str(f, "country"), dob: str(f, "dob") || null, showName: on(f, "show_name"), showEmail: on(f, "show_email"), showPhone: on(f, "show_phone") }), "User Information Updated");
}
export async function changePasswordAction(f: FormData) {
  await act("/portal/profile", (u, d) => A.changePassword(d, u.id, String(f.get("current") ?? ""), String(f.get("password") ?? ""), String(f.get("password2") ?? "")), "User Password Updated");
}
export async function setMpinAction(f: FormData) {
  await act("/portal/profile", (u, d) => A.setMpin(d, u.id, str(f, "mpin"), str(f, "mpin2")), "MPIN Updated.");
}
export async function savePhotoAction(f: FormData) {
  const file = f.get("photo");
  const data = file instanceof File && file.size ? Buffer.from(await file.arrayBuffer()) : null;
  await act("/portal/profile", (u, d) => A.savePhoto(d, u.id, f.get("remove") === "1" ? null : data), "Picture updated.");
}

export async function requestFundsAction(f: FormData) {
  await act("/portal/funds", async (u, d) => {
    await A.checkMpin(d, u.id, str(f, "mpin"));
    await Bl.requestFunds(d, u.id, Math.round(Number(str(f, "amount")) * 100), str(f, "method"), str(f, "remarks"));
  }, "Funds request sent. It will show as Completed once the payment is confirmed.");
}
export async function transferFundsAction(f: FormData) {
  await act("/portal/funds?tab=transfer", async (u, d) => {
    await A.checkMpin(d, u.id, str(f, "mpin"));
    await Bl.transferFunds(d, u.id, Math.round(Number(str(f, "amount")) * 100), str(f, "to"), str(f, "remarks"));
  }, "Funds transferred.");
}
export async function newInvoiceAction(f: FormData) {
  const want = str(f, "plan");
  const plan = (["monthly", "yearly", "group_monthly", "group_yearly"] as const).find((k) => k === want) ?? "monthly";
  await act("/portal/invoices", (u, d) => Bl.invoiceFor(d, u.id, plan), "Invoice created. Pay it from your Funds.");
}
export async function payInvoiceAction(f: FormData) {
  await act("/portal/invoices", (u, d) => Bl.payInvoice(d, u.id, int(f, "id")), "Invoice paid. Thank you!");
}

export async function decideFundsAction(f: FormData) {
  const u = await requireUser();
  if (!u.is_admin) redirect("/dashboard");
  await Bl.decideFunds(await db(), int(f, "id"), str(f, "ok") === "1");
  redirect("/ceo?ok=" + encodeURIComponent("Saved."));
}
