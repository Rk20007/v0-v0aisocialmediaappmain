"use client"
import InstallPrompt from "@/components/install-prompt"

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <InstallPrompt />
    </div>
  )
}
