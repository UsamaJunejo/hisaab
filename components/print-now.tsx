"use client";

import { useEffect } from "react";

export function PrintNow() {
  useEffect(() => { const t = setTimeout(() => window.print(), 600); return () => clearTimeout(t); }, []);
  return (
    <div className="no-print fixed right-4 top-4 flex gap-2">
      <button onClick={() => window.print()} className="btn btn-blue">Print / Save PDF</button>
      <button onClick={() => window.close()} className="btn btn-dark">Close</button>
    </div>
  );
}
