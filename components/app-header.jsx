"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from "lucide-react"

export default function AppHeader({ title }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <Link href="/feed" className="text-xl font-bold text-blue-600">
          {title || "Colorcode"}
        </Link>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-muted rounded-full transition-colors relative">
            <Bell className="h-5 w-5" />
          </button>

          <Link href="/profile">
            <Avatar className="h-8 w-8 border-2 border-blue-600/20">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
              <AvatarFallback className="text-xs bg-blue-600/10 text-blue-600">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
