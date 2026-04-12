"use client"

import { useEffect, useRef } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

/**
 * Once per day (per device), show a browser notification when the user opted in on Profile.
 * Works only while the app tab is open and notification permission is granted — not a server push.
 */
export default function DailyAiReminder() {
  const { user } = useAuth()
  const { data: walletData } = useSWR(user ? "/api/wallet" : null, fetcher, { revalidateOnFocus: false })
  const firedRef = useRef(false)

  useEffect(() => {
    if (!user?.dailyAiImageReminder || firedRef.current) return
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    const today = new Date().toISOString().slice(0, 10)
    const storageKey = `ck-daily-ai-remind-${today}`
    if (localStorage.getItem(storageKey)) return

    const walletOn = walletData?.walletEnabled === true
    const starterLeft = walletData?.starterFreeAiLeft
    const starterTotal = walletData?.starterFreeAiTotal

    let body = "Open Create to make something new on ColorKode."
    if (!walletOn) {
      body = "Wallet is off — AI images and posts are free. Tap Create to start."
    } else if (typeof starterLeft === "number" && typeof starterTotal === "number") {
      body =
        starterLeft > 0
          ? `You have ${starterLeft} starter free AI image${starterLeft === 1 ? "" : "s"} left (of ${starterTotal}).`
          : `Starter free AI used — new images use coins. Earn from reels (+2) and posts (+1).`
    }

    try {
      new Notification("ColorKode — daily reminder", { body, icon: "/icon-192.jpg" })
    } catch {
      return
    }

    localStorage.setItem(storageKey, "1")
    firedRef.current = true
  }, [
    user?.dailyAiImageReminder,
    walletData?.walletEnabled,
    walletData?.starterFreeAiLeft,
    walletData?.starterFreeAiTotal,
  ])

  return null
}
