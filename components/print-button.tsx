"use client";

export function PrintButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return <button type="button" onClick={() => window.print()} className="rounded-md p-1.5 hover:bg-page" title={label} aria-label={label}>{icon}</button>;
}
