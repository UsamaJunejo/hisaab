"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { forgot, login, resetPassword, signup, type FormState } from "@/app/actions/auth";
import { COUNTRIES } from "@/lib/countries";

function Msg({ s }: { s: FormState }) {
  if (s.error) return <p role="alert" className="rounded-lg bg-red-soft px-3 py-2 text-sm font-medium text-red">{s.error}</p>;
  if (s.ok) return <p role="status" className="rounded-lg bg-green-soft px-3 py-2 text-sm font-medium text-green">{s.ok}</p>;
  return null;
}

export function LoginForm() {
  const [s, act, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={act} key={s.n} className="space-y-3">
      <Msg s={s} />
      <input name="username" defaultValue={s.v?.username} required autoComplete="username" placeholder="Email address / cell number" className="input" />
      <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className="input" />
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="remember" defaultChecked /> Remember Me</label>
        <Link href="/forgot" className="font-semibold text-blue">Forgot Password?</Link>
      </div>
      <button className="btn btn-orange w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-muted">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-blue">Create your account</Link></p>
    </form>
  );
}

const PLANS = [
  ["free", "FREE", "USD 0.00", "Free for 14 days, with 25 MB data"],
  ["monthly", "PERSONAL", "USD 1 / MONTH", "Single user, 100 MB data / month"],
  ["yearly", "PERSONAL YEARLY", "USD 10 / YEAR", "Save 16%: single user, 100 MB data"],
] as const;

export function SignupForm({ refCode }: { refCode?: string }) {
  const [s, act, pending] = useActionState<FormState, FormData>(signup, {});
  const [country, setCountry] = useState(s.v?.country || "PK");
  const code = COUNTRIES.find((c) => c[0] === country)?.[2] ?? "";
  return (
    <form action={act} key={s.n} className="space-y-3">
      <Msg s={s} />
      <input type="hidden" name="ref" value={refCode ?? ""} />
      <input name="name" defaultValue={s.v?.name} required autoComplete="name" placeholder="Full Name" className="input" />
      <input name="email" defaultValue={s.v?.email} type="email" required autoComplete="email" placeholder="Email" className="input" />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className="input" aria-label="Country">
          {COUNTRIES.map((c) => <option key={c[0]} value={c[0]}>{c[1]} ({c[2]})</option>)}
        </select>
        <div className="field"><span className="field-label min-w-0">+{code}</span><input name="phone" defaultValue={s.v?.phone} required inputMode="tel" placeholder="Cell #" className="field-input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Password" className="input" />
        <input name="password2" type="password" required autoComplete="new-password" placeholder="Confirm Password" className="input" />
      </div>
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="mb-1 text-sm font-semibold">Select your package</legend>
        {PLANS.map(([v, t, p, d], i) => (
          <label key={v} className="cursor-pointer rounded-xl border-2 border-line p-3 has-[:checked]:border-orange has-[:checked]:bg-orange/5">
            <input type="radio" name="plan" value={v} defaultChecked={s.v?.plan ? s.v.plan === v : i === 0} className="sr-only" />
            <span className="block text-xs font-bold tracking-wide text-muted">{t}</span>
            <span className="block text-lg font-bold">{p}</span>
            <span className="block text-xs text-muted">{d}</span>
          </label>
        ))}
      </fieldset>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="accept" className="mt-1" required /> I accept the <Link href="/terms" className="text-blue underline">Terms of Use</Link></label>
      <button className="btn btn-orange w-full" disabled={pending}>{pending ? "Registering…" : "Sign up"}</button>
      <p className="text-center text-sm text-muted">Already registered? <Link href="/login" className="font-semibold text-blue">Sign in</Link></p>
    </form>
  );
}

export function ForgotForm({ token }: { token?: string }) {
  const [s, act, pending] = useActionState<FormState, FormData>(token ? resetPassword : forgot, {});
  return (
    <form action={act} className="space-y-3">
      <Msg s={s} />
      {token ? (
        <>
          <input type="hidden" name="token" value={token} />
          <input name="password" type="password" required minLength={6} placeholder="New Password" className="input" />
          <input name="password2" type="password" required placeholder="Confirm Password" className="input" />
        </>
      ) : (
        <input name="email" type="email" required placeholder="Enter your registered email" className="input" />
      )}
      <div className="flex gap-2">
        <Link href="/login" className="btn btn-dark flex-1">Cancel</Link>
        <button className="btn btn-orange flex-1" disabled={pending}>Submit</button>
      </div>
    </form>
  );
}
