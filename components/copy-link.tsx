"use client";

import { useEffect, useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [done, setDone] = useState(false);
  useEffect(() => setUrl(location.origin + path), [path]);
  return (
    <div className="flex gap-2">
      <input readOnly value={url} className="input font-mono text-xs" aria-label="Invitation link" onFocus={(e) => e.target.select()} />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* select instead */ } }} className="btn btn-blue">{done ? "Copied" : "Copy"}</button>
    </div>
  );
}
