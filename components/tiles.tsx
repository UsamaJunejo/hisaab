import Link from "next/link";
import { CatIcon } from "@/components/icons";
import { moneyTile } from "@/lib/format";
import { EditTileButton, AddTileButton } from "@/components/tile-buttons";
import type { NodeSpec } from "@/components/node-dialog";

export type TileData = { key: string; href: string; name: string; color: string; icon: string; balance: number; edit?: NodeSpec };

/** A dashboard tile: coloured icon square, NAME, balance (negative in brackets), pencil to edit. */
export function Tile({ t, wide = false }: { t: TileData; wide?: boolean }) {
  return (
    <div data-search={t.name} className={`group relative ${wide ? "" : ""}`}>
      <Link href={t.href} className="card flex h-full items-center gap-4 p-4 pr-10 transition hover:-translate-y-0.5 hover:shadow-lg">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white shadow-inner" style={{ background: t.color }}>
          <CatIcon name={t.icon} className="h-7 w-7" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.8rem] font-semibold tracking-wide text-muted uppercase">{t.name}</span>
          <span className={`num block truncate text-[1.45rem] font-light ${t.balance < 0 ? "text-red" : "text-ink"}`}>{moneyTile(t.balance)}</span>
        </span>
      </Link>
      {t.edit && <EditTileButton spec={t.edit} name={t.name} />}
    </div>
  );
}

export function TileGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 3 | 4 }) {
  return <div className={`grid gap-3 sm:grid-cols-2 ${cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>{children}</div>;
}

export function AddTile({ label, spec }: { label: string; spec: NodeSpec }) {
  return <AddTileButton label={label} spec={spec} />;
}

export function Divider() {
  return <hr className="my-5 border-line" />;
}
