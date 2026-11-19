import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";

export const metadata = { title: "Sign in" };

export default async function Login() {
  if (await currentUser()) redirect("/dashboard");
  return <AuthCard title="Sign in"><LoginForm /></AuthCard>;
}
