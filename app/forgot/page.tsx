import { AuthCard } from "@/components/auth-card";
import { ForgotForm } from "@/components/auth-forms";

export const metadata = { title: "Forgot password" };

export default async function Forgot({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthCard title={token ? "Set a new password" : "Forgot Password?"}><ForgotForm token={token} /></AuthCard>;
}
