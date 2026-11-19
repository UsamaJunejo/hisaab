"use server";

import * as B from "@/lib/books";
import { act, int, str } from "@/lib/act";
import { setFilter } from "@/lib/filter";
import type { FilterKey, Nature } from "@/lib/books";
import { redirect } from "next/navigation";

/** One form for add / edit / delete of a category, sub-category or account (MunshiBaba's single pop-up). */
export async function saveNode(f: FormData) {
  const level = str(f, "level") as "category" | "sub" | "account";
  const op = str(f, "op") as "add" | "edit" | "delete";
  const id = int(f, "id"), parent = int(f, "parent");
  const look = { name: str(f, "name"), color: str(f, "color"), icon: str(f, "icon") };
  const nature = str(f, "nature") as Nature;
  const word = level === "category" ? "Category" : level === "sub" ? "Sub Category" : "Account";
  await act(str(f, "back"), async (u, d) => {
    if (level === "category") {
      if (op === "add") await B.addCategory(d, u.id, { ...look, nature });
      else if (op === "edit") await B.updateCategory(d, u.id, id, { ...look, nature });
      else await B.deleteCategory(d, u.id, id);
    } else if (level === "sub") {
      // In the 2-level system the "categories" on screen are sub-categories: put them under a category of the chosen nature.
      const cat = parent || (op === "add" ? await categoryForNature(d, u.id, nature) : 0);
      if (op === "add") await B.addSub(d, u.id, cat, look);
      else if (op === "edit") await B.updateSub(d, u.id, id, look);
      else await B.deleteSub(d, u.id, id);
    } else {
      const sub = parent || (op === "add" ? await subForNature(d, u.id, nature) : 0);
      if (op === "add") await B.addAccount(d, u.id, sub, look);
      else if (op === "edit") await B.updateAccount(d, u.id, id, look);
      else await B.deleteAccount(d, u.id, id);
    }
  }, op === "add" ? `${word} Added Successfully.` : op === "edit" ? `${word} Updated.` : `${word} Deleted.`);
}

type D = Parameters<typeof B.categories>[0];
async function categoryForNature(d: D, uid: number, nature: Nature) {
  if (!B.NATURES.includes(nature)) throw new Error("Please Select Nature");
  const [c] = await d.q<{ id: number }>("SELECT id FROM categories WHERE user_id = $1 AND nature = $2 AND kind = 'normal' ORDER BY sort, id LIMIT 1", [uid, nature]);
  return c?.id ?? (await B.addCategory(d, uid, { name: nature.toUpperCase(), nature, color: "#000000", icon: "plus-circle" }));
}
async function subForNature(d: D, uid: number, nature: Nature) {
  const cat = await categoryForNature(d, uid, nature);
  const [s] = await d.q<{ id: number }>("SELECT id FROM subcategories WHERE category_id = $1 ORDER BY id LIMIT 1", [cat]);
  return s?.id ?? (await B.addSub(d, uid, cat, { name: "GENERAL", color: "#000000", icon: "plus-circle" }));
}

export async function applyFilter(f: FormData) {
  const mode = str(f, "mode");
  const back = str(f, "back") || "/dashboard";
  if (mode === "custom") {
    const from = str(f, "from"), to = str(f, "to");
    if (!from) redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent("Please Select Custom Date From.")}`);
    if (!to) redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent("Please Select Custom Date To.")}`);
    await setFilter({ key: "custom", from: from <= to ? from : to, to: from <= to ? to : from });
  } else await setFilter({ key: (str(f, "key") || "all") as FilterKey });
  redirect(back);
}
