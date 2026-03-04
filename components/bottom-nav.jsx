"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, Users, MessageCircle, Film } from "lucide-react"
import { cn } from "@/lib/utils"

const sideItems = [
  { href: "/feed",     icon: Home,          label: "Home"    },
  { href: "/reels",    icon: Film,          label: "Reels"   },
  { href: "/friends",  icon: Users,         label: "Friends" },
  { href: "/messages", icon: MessageCircle, label: "Chat"    },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isCreateActive = pathname === "/create" || pathname.startsWith("/create/")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-card/95 backdrop-blur-md border-t border-border" />

      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {/* Left two items */}
        {sideItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all",
                isActive ? "text-[#c9424a]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className={cn("p-1.5 rounded-xl transition-all", isActive && "bg-[#c9424a]/10")}>
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          )
        })}

        {/* Centre Create button — elevated */}
        <div className="flex flex-col items-center justify-center flex-1 relative" style={{ marginTop: "-20px" }}>
          <Link href="/create" className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95",
                isCreateActive
                  ? "bg-[#a0353b] shadow-[#c9424a]/40"
                  : "bg-gradient-to-br from-[#c9424a] to-[#e06b72] shadow-[#c9424a]/30",
              )}
              style={{ boxShadow: "0 4px 20px rgba(201,66,74,0.45)" }}
            >
              <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold tracking-wide",
                isCreateActive ? "text-[#c9424a]" : "text-muted-foreground",
              )}
            >
              Create
            </span>
          </Link>
        </div>

        {/* Right two items */}
        {sideItems.slice(2).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all",
                isActive ? "text-[#c9424a]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className={cn("p-1.5 rounded-xl transition-all", isActive && "bg-[#c9424a]/10")}>
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
