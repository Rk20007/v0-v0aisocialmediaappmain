import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import LoginForm from "@/components/login-form"

export const metadata = {
  title: "Login - ColorKode",
  description: "Sign in to your ColorKode account",
}

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/feed")
  }

  return <LoginForm />
}
