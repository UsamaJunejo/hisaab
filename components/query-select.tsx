"use client";

import { useRouter } from "next/navigation";

/** A drop-down that puts its value in the address (?name=value), e.g. sort order or currency. */
export function QuerySelect({ name, value, options, label }: { name: string; value: string; options: [string, string][]; label: string }) {
  const router = useRouter();
  return (
    <select aria-label={label} value={value} onChange={(e) => { const u = new URL(location.href); u.searchParams.set(name, e.target.value); router.push(u.pathname + u.search); }} className="input w-auto min-w-52">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
