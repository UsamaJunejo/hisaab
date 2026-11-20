import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/auth-forms";
import { db } from "@/lib/db";
import { localPricer } from "@/lib/geo";

export const metadata = { title: "Sign up" };

export default async function Signup({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const p = await localPricer(await db());
  const local = p ? { monthly: p(100), yearly: p(1000), group_monthly: p(300), group_yearly: p(3000) } : undefined;
  return <AuthCard title="Create your account"><SignupForm refCode={ref} local={local} /></AuthCard>;
}
