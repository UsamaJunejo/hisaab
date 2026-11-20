import { Pencil, Trash2 } from "lucide-react";
import { requireBusiness } from "@/lib/biz-session";
import { listRows, products, stock } from "@/lib/business";
import { money } from "@/lib/format";
import { BizPage, BizFields } from "@/components/biz/biz-page";
import { ConfirmForm } from "@/components/confirm-form";
import { deleteProductAction, saveProductAction } from "@/app/actions/business";

export const metadata = { title: "Product Entry" };

/** PRODUCT ENTRY: add products (name, category, type, barcode, prices, tax, size, colour, location, low-stock level) and see them with their stock. */
export default async function Products({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { u, d, b, list } = await requireBusiness();
  const [rows, cats, taxes, st] = await Promise.all([products(d, u.id, b.id), listRows(d, u.id, b.id, "categories"), listRows(d, u.id, b.id, "taxes"), stock(d, u.id, b.id)]);
  const onHand = new Map(st.map((s) => [s.id, s.on_hand]));
  const editId = Number((await searchParams).edit);
  const e = rows.find((r) => r.id === editId);
  const amt = (v: number | undefined) => (v !== undefined ? (v / 100).toFixed(2) : "");
  return (
    <BizPage title="Product Entry" u={u} b={b} list={list}>
      <form action={saveProductAction} key={e?.id ?? "new"} className="card mb-4 grid gap-3 p-4 sm:grid-cols-3">
        <BizFields biz={b.id} /><input type="hidden" name="id" value={e?.id ?? 0} />
        <label className="text-sm font-semibold sm:col-span-2">Product Name*<input name="name" required defaultValue={e?.name} placeholder="Enter Product Name" className="input mt-1" /></label>
        <label className="text-sm font-semibold">Category<select name="category_id" defaultValue={e?.category_id ?? ""} className="input mt-1"><option value="">Select</option>{cats.map((c) => <option key={c.id as number} value={c.id as number}>{c.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Product Type<select name="type" defaultValue={e?.type ?? "Stock"} className="input mt-1"><option value="Stock">Stock (kept in store)</option><option value="Service">Service (no stock)</option></select></label>
        <label className="text-sm font-semibold">Sale Price* ({u.currency})<input name="sale_price" required inputMode="decimal" defaultValue={amt(e?.sale_price)} placeholder="Product Sale Price" className="input mt-1" /></label>
        <label className="text-sm font-semibold">Purchase Price ({u.currency})<input name="purchase_price" inputMode="decimal" defaultValue={amt(e?.purchase_price) || "0"} placeholder="Product Purchase Price" className="input mt-1" /></label>
        <label className="text-sm font-semibold">Tax<select name="tax_id" defaultValue={e?.tax_id ?? ""} className="input mt-1"><option value="">No tax</option>{taxes.map((x) => <option key={x.id as number} value={x.id as number}>{x.name}</option>)}</select></label>
        <label className="text-sm font-semibold">BarCode<input name="barcode" defaultValue={e?.barcode ?? ""} placeholder="Product Barcode" className="input mt-1" /></label>
        <label className="text-sm font-semibold">Low stock alert at<input name="low_stock" inputMode="decimal" defaultValue={e?.low_stock ?? 0} className="input mt-1" /></label>
        <label className="text-sm font-semibold">Size / Weight<input name="size" defaultValue={e?.size ?? ""} placeholder="Enter Size / Weight Here" className="input mt-1" /></label>
        <label className="text-sm font-semibold">Color<input name="color" defaultValue={e?.color ?? ""} placeholder="Enter Color Here" className="input mt-1" /></label>
        <label className="text-sm font-semibold">Location<input name="location" defaultValue={e?.location ?? ""} placeholder="Shelf / rack" className="input mt-1" /></label>
        <div className="flex items-end justify-end gap-2 sm:col-span-3">{e && <a href="/business/products" className="btn btn-ghost">Cancel</a>}<button className="btn btn-green">{e ? "Update" : "Save"}</button></div>
      </form>
      <div className="card overflow-x-auto p-3">
        <table className="tbl">
          <thead><tr><th>S/No</th><th>Product Name</th><th>Category</th><th className="r">Sale Price</th><th className="r">Purchase Price</th><th className="r">Qty</th><th>Barcode</th><th className="c">Edit</th><th className="c">Delete</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-muted">No products yet. Add your first product above.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id} data-search={`${r.name} ${r.barcode ?? ""} ${r.category ?? ""}`}>
                <td>{i + 1}.</td><td className="font-medium">{r.name}{r.type === "Service" && <span className="ml-1 text-xs text-muted">(service)</span>}</td><td>{r.category}</td>
                <td className="r num">{money(r.sale_price)}</td><td className="r num">{money(r.purchase_price)}</td>
                <td className="r num">{r.type === "Service" ? "—" : onHand.get(r.id) ?? 0}</td><td className="num">{r.barcode}</td>
                <td className="c"><a href={`/business/products?edit=${r.id}`} aria-label="Edit" className="inline-flex text-blue"><Pencil className="h-4 w-4" /></a></td>
                <td className="c"><ConfirmForm action={deleteProductAction} fields={{ biz: b.id, id: r.id }} message={`Delete ${r.name}?`} className="inline-flex text-red"><Trash2 className="h-4 w-4" aria-label="Delete" /></ConfirmForm></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BizPage>
  );
}
