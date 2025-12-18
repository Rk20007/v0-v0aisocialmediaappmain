import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import SignupForm from "@/components/signup-form"

export const metadata = {
  title: "Sign Up - Colorcode",
  description: "Create your Colorcode account",
}

export default async function SignupPage() {
  const session = await getSession()

  if (session) {
    redirect("/feed")
  }

  return <SignupForm />
}
