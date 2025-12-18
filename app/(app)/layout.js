import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import BottomNav from "@/components/bottom-nav"
import AppHeader from "@/components/app-header"
import InstallPrompt from "@/components/install-prompt"

export default async function AppLayout({ children }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="max-w-lg mx-auto">{children}</main>
      <BottomNav />
      <InstallPrompt />
    </div>
  )
}
