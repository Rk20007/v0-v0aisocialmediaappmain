"use client"

import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Zap } from "lucide-react"
import WalletPopup from "./wallet-popup"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

export default function AppHeader({ title }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [showWallet, setShowWallet] = useState(false)

  // All hooks must be called before any early return
  const { data: walletData } = useSWR("/api/wallet", fetcher, {
    revalidateOnFocus: false,
  })

  // Hide header on full-screen pages
  const isReels = pathname === "/reels" || pathname.startsWith("/reels/")
  const isChat  = pathname.startsWith("/messages/") && pathname !== "/messages"
  if (isReels || isChat) return null

  const coins = walletData?.coins || 0

  return (
    <>
      <WalletPopup open={showWallet} onOpenChange={setShowWallet} />
      
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Link href="/feed" className="text-xl font-bold text-[#c9424a]">
            {title || "ColorKode"}
          </Link>

          <div className="flex items-center gap-2">
            {/* Wallet / Coins Button */}
            <button 
              onClick={() => setShowWallet(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full hover:bg-yellow-100 transition-colors"
            >
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-bold text-[#c9424a]">{coins}</span>
            </button>

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
    </>
  )
}
