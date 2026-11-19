"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { NodeDialog, type NodeSpec } from "@/components/node-dialog";

export function EditTileButton({ spec, name }: { spec: NodeSpec; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Edit ${name}`} title="Edit" className="absolute right-2.5 top-2.5 rounded-md p-1.5 text-muted hover:bg-page hover:text-ink">
        <Pencil className="h-4 w-4" />
      </button>
      {open && <NodeDialog spec={spec} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AddTileButton({ label, spec }: { label: string; spec: NodeSpec }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="card flex items-center gap-4 border-2 border-dashed border-line p-4 text-left transition hover:border-orange">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-grey-btn text-white"><Plus className="h-7 w-7" /></span>
        <span className="text-[0.85rem] font-semibold tracking-wide uppercase">{label}</span>
      </button>
      {open && <NodeDialog spec={spec} onClose={() => setOpen(false)} />}
    </>
  );
}
