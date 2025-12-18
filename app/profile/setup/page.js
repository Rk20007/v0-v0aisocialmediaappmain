import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import ProfileSetup from "@/components/profile-setup"

export const metadata = {
  title: "Setup Profile - Colorcode",
  description: "Complete your Colorcode profile",
}

export default async function ProfileSetupPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return <ProfileSetup />
}
