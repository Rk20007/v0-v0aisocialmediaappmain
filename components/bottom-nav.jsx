"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Plus, Users, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const sideItems = [
  { href: "/feed",     icon: Home,          label: "Home"    },
  { href: "/reels",    icon: Film,          label: "Reels"   },
  { href: "/friends",  icon: Users,         label: "Friends" },
  { href: "/messages", icon: MessageCircle, label: "Chat"    },
]

export default function BottomNav() {
  const pathname = usePathname()

  // ── Full-screen pages: hide nav entirely ──
  const isReels = pathname === "/reels" || pathname.startsWith("/reels/")
  const isChat  = pathname.startsWith("/messages/") && pathname !== "/messages"
  if (isReels || isChat) return null

  const isCreateActive = pathname === "/create" || pathname.startsWith("/create/")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/96 backdrop-blur-xl border-t border-border/40" />

      <div className="relative flex items-center justify-around h-[60px] max-w-lg mx-auto px-3">

        {/* Left two: Home, Reels */}
        {sideItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] active:opacity-70"
            >
              <Icon
                className={cn(
                  "transition-all duration-200",
                  isActive
                    ? "text-[#c9424a] h-[27px] w-[27px]"
                    : "text-foreground/50 dark:text-white/50 h-[25px] w-[25px]",
                )}
                strokeWidth={isActive ? 2.4 : 1.7}
              />
            </Link>
          )
        })}

        {/* Centre: Create — thin circle, no fill background */}
        <Link
          href="/create"
          className="flex flex-col items-center justify-center flex-1 h-full active:opacity-70"
        >
          <div
            className={cn(
              "h-9 w-9 rounded-full border-[2px] flex items-center justify-center transition-all duration-200",
              isCreateActive
                ? "border-[#c9424a]"
                : "border-foreground/55 dark:border-white/55",
            )}
          >
            <Plus
              className={cn(
                "h-[18px] w-[18px] transition-all duration-200",
                isCreateActive
                  ? "text-[#c9424a]"
                  : "text-foreground/65 dark:text-white/65",
              )}
              strokeWidth={2.5}
            />
          </div>
        </Link>

        {/* Right two: Friends, Chat */}
        {sideItems.slice(2).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] active:opacity-70"
            >
              <Icon
                className={cn(
                  "transition-all duration-200",
                  isActive
                    ? "text-[#c9424a] h-[27px] w-[27px]"
                    : "text-foreground/50 dark:text-white/50 h-[25px] w-[25px]",
                )}
                strokeWidth={isActive ? 2.4 : 1.7}
              />
            </Link>
          )
        })}

      </div>
    </nav>
  )
}
