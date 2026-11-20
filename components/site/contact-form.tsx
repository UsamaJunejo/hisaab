"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "@/app/actions/contact";

export function ContactForm() {
  const [s, act, pending] = useActionState<ContactState, FormData>(sendContact, {});
  return (
    <form action={act} key={s.n} className="grid gap-3 sm:grid-cols-2">
      {s.error && <p role="alert" className="rounded-lg bg-red-soft px-3 py-2 text-sm font-medium text-red sm:col-span-2">{s.error}</p>}
      {s.ok && <p role="status" className="rounded-lg bg-green-soft px-3 py-2 text-sm font-medium text-green sm:col-span-2">{s.ok}</p>}
      <input name="first" required placeholder="First name" autoComplete="given-name" className="input" />
      <input name="last" placeholder="Last name" autoComplete="family-name" className="input" />
      <input name="phone" inputMode="tel" placeholder="Phone" autoComplete="tel" className="input" />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className="input" />
      <input name="company" placeholder="Company" autoComplete="organization" className="input sm:col-span-2" />
      <textarea name="message" required rows={4} placeholder="Your message" className="input sm:col-span-2" />
      <div className="sm:col-span-2"><button className="btn btn-orange" disabled={pending}>{pending ? "Sending…" : "Send"}</button></div>
    </form>
  );
}
