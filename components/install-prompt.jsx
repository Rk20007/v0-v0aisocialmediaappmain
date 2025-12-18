"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true)
      return
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error)
    }

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // Show iOS instructions after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 5000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem("installPromptDismissed", Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem("installPromptDismissed")
    if (dismissed) {
      const daysSince = (Date.now() - Number.parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        setShowPrompt(false)
      }
    }
  }, [])

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="border-0 shadow-xl bg-gradient-to-r from-primary to-teal-500">
        <CardContent className="p-4">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {isIOS ? <Smartphone className="h-8 w-8 text-white" /> : <Download className="h-8 w-8 text-white" />}
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">Install Colorcode</h3>

              {isIOS ? (
                <div className="text-white/90 text-sm space-y-1">
                  <p>Add to your home screen:</p>
                  <ol className="list-decimal list-inside text-xs space-y-0.5">
                    <li>
                      Tap the Share button{" "}
                      <span className="inline-block px-1 py-0.5 bg-white/20 rounded text-xs">↑</span>
                    </li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right</li>
                  </ol>
                </div>
              ) : (
                <>
                  <p className="text-white/90 text-sm mb-3">Install the app for the best experience - works offline!</p>
                  <div className="flex gap-2">
                    <Button onClick={handleInstall} size="sm" className="bg-white text-primary hover:bg-white/90">
                      <Download className="h-4 w-4 mr-1" />
                      Install App
                    </Button>
                    <Button onClick={handleDismiss} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                      Later
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
