"use client";

import { useEffect, useState } from "react";
import { fmtTime } from "@/lib/format";

/** Live time + date at the left of the menu row (ticks every second, 12/24 hour as set). */
export function Clock({ time24 }: { time24: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="w-28" />;
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return (
    <div className="flex w-28 shrink-0 flex-col items-center justify-center border-r border-line pr-3 text-center leading-tight">
      <span className="num text-sm font-semibold">{fmtTime(now, time24)}</span>
      <span className="num text-xs text-muted">{iso}</span>
    </div>
  );
}
