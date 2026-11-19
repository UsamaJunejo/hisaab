import { Bars, Doughnut } from "@/components/charts";
import { AddTile, Divider, Tile, TileGrid, type TileData } from "@/components/tiles";
import { fmtDate, type DateFormat } from "@/lib/format";
import type { NodeSpec } from "@/components/node-dialog";

/** Range line under the title: "dd-mm-yyyy to dd-mm-yyyy". */
export function RangeLine({ from, to, f }: { from: string; to: string; f: DateFormat }) {
  return <p className="num mb-4 text-sm font-semibold">{fmtDate(from, f)} to {fmtDate(to, f)}</p>;
}

export function DashBody({ tiles, add, extraRow, bottom, chart = true }: { tiles: TileData[]; add?: { label: string; spec: NodeSpec }; extraRow?: TileData[]; bottom?: TileData[]; chart?: boolean }) {
  return (
    <>
      <TileGrid>
        {tiles.map((t) => <Tile key={t.key} t={t} />)}
        {add && <AddTile label={add.label} spec={add.spec} />}
      </TileGrid>
      {extraRow && extraRow.length > 0 && (
        <>
          <Divider />
          <TileGrid>{extraRow.map((t) => <Tile key={t.key} t={t} />)}</TileGrid>
        </>
      )}
      {bottom && (
        <>
          <Divider />
          <TileGrid cols={3}>{bottom.map((t) => <Tile key={t.key} t={t} />)}</TileGrid>
        </>
      )}
      {chart && tiles.some((t) => t.balance !== 0) && (
        <>
          <Divider />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="card p-4"><Doughnut data={tiles.map((t) => ({ name: t.name, value: t.balance, color: t.color }))} /></div>
            <div className="card p-4"><Bars data={tiles.map((t) => ({ name: t.name, value: t.balance, color: t.color }))} /></div>
          </div>
        </>
      )}
    </>
  );
}
