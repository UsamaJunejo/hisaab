import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/auth-forms";

export const metadata = { title: "Sign up" };

export default async function Signup({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return <AuthCard title="Create your account"><SignupForm refCode={ref} /></AuthCard>;
}
