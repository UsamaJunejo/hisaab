import { money } from "@/lib/format";

type Slice = { name: string; value: number; color: string };

/** Doughnut of the sizes (absolute balances) of each tile, in the tiles' colours. */
export function Doughnut({ data }: { data: Slice[] }) {
  const items = data.filter((d) => d.value !== 0);
  const total = items.reduce((s, d) => s + Math.abs(d.value), 0);
  if (!total) return <p className="grid h-64 place-items-center text-sm text-muted">No entries yet</p>;
  let a = -Math.PI / 2;
  const R = 90, r = 34, cx = 100, cy = 100;
  const arcs = items.map((d) => {
    const frac = Math.abs(d.value) / total;
    const a2 = a + frac * Math.PI * 2;
    const large = a2 - a > Math.PI ? 1 : 0;
    const p = (ang: number, rad: number) => `${cx + rad * Math.cos(ang)} ${cy + rad * Math.sin(ang)}`;
    const path = frac >= 0.9999
      ? `M ${p(0, R)} A ${R} ${R} 0 1 1 ${p(Math.PI, R)} A ${R} ${R} 0 1 1 ${p(0, R)} M ${p(0, r)} A ${r} ${r} 0 1 0 ${p(Math.PI, r)} A ${r} ${r} 0 1 0 ${p(0, r)} Z`
      : `M ${p(a, R)} A ${R} ${R} 0 ${large} 1 ${p(a2, R)} L ${p(a2, r)} A ${r} ${r} 0 ${large} 0 ${p(a, r)} Z`;
    const out = { path, d };
    a = a2;
    return out;
  });
  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-72 w-72" role="img" aria-label="Share of each balance">
      {arcs.map(({ path, d }) => <path key={d.name} d={path} fill={d.color} fillRule="evenodd" stroke="white" strokeWidth="1.5"><title>{`${d.name}: ${money(d.value)}`}</title></path>)}
    </svg>
  );
}

/** Bar chart of the balances; negatives go below the zero line. */
export function Bars({ data }: { data: Slice[] }) {
  const items = data;
  const max = Math.max(1, ...items.map((d) => Math.max(0, d.value)));
  const min = Math.min(0, ...items.map((d) => d.value));
  const span = max - min || 1;
  const W = 600, H = 300, pad = 56, top = 14, bottom = 14;
  const y = (v: number) => top + ((max - v) / span) * (H - top - bottom);
  const slot = (W - pad - 10) / Math.max(1, items.length);
  const bw = slot * 0.62; // bars share the width evenly, as in MunshiBaba
  const ticks = 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full" role="img" aria-label="Balances">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = max - (span * i) / ticks;
        return (
          <g key={i}>
            <line x1={pad} x2={W - 4} y1={y(v)} y2={y(v)} stroke="#e3e7ee" />
            <text x={pad - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#7a8394">{Math.round(v / 100).toLocaleString("en-US")}</text>
          </g>
        );
      })}
      <line x1={pad} x2={W - 4} y1={y(0)} y2={y(0)} stroke="#9aa3b2" />
      {items.map((d, i) => {
        const x = pad + 10 + i * slot + (slot - bw) / 2;
        const y0 = y(0), y1 = y(d.value);
        return <rect key={d.name} x={x} width={bw} y={Math.min(y0, y1)} height={Math.max(1, Math.abs(y1 - y0))} fill={d.color} rx="3"><title>{`${d.name}: ${money(d.value)}`}</title></rect>;
      })}
    </svg>
  );
}
