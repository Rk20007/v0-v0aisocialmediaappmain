"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, Users, MessageCircle, Film } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/create", icon: Sparkles, label: "Create" },
  { href: "/reels", icon: Film, label: "Reels" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/messages", icon: MessageCircle, label: "Chat" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl transition-all min-w-16",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className={cn("p-1.5 rounded-xl transition-all", isActive && "bg-primary/10")}>
                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
