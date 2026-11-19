"use client";

import { useEffect, useState } from "react";

/** "Show all in black": turns off the red colour of negative amounts. */
export function ShowAllBlack() {
  const [on, setOn] = useState(false);
  useEffect(() => { document.querySelectorAll<HTMLElement>(".worth-neg").forEach((e) => e.classList.toggle("text-red", !on)); }, [on]);
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> Show all in black</label>;
}
