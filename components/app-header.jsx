"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Film, Heart, Plus } from "lucide-react"

export default function AppHeader({ title }) {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <Link href="/feed" className="text-xl font-bold text-[#c9424a]">
          {title || "Colorcode"}
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-background border border-border rounded-lg shadow-lg p-2 w-40 z-50">
                <Link href="/create">
                  <div className="px-4 py-2 hover:bg-muted rounded cursor-pointer transition-colors text-sm">
                    📝 Create Post
                  </div>
                </Link>
                <Link href="/reels">
                  <div className="px-4 py-2 hover:bg-muted rounded cursor-pointer transition-colors text-sm">
                    🎬 Create Reel
                  </div>
                </Link>
                <Link href="/love-point">
                  <div className="px-4 py-2 hover:bg-muted rounded cursor-pointer transition-colors text-sm">
                    ❤️ Love Point
                  </div>
                </Link>
              </div>
            )}
          </div>

       

          <Link href="/profile">
            <Avatar className="h-8 w-8 border-2 border-[#c9424a]/20">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
              <AvatarFallback className="text-xs bg-[#c9424a]/10 text-[#c9424a]">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
