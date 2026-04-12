"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Wallet, Zap, CheckCircle2, X } from "lucide-react"
import useSWR from "swr"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

const RECHARGE_PACKAGES = [
  { id: 1, coins: 50, price: 50, popular: false },
  { id: 2, coins: 100, price: 100, popular: true },
  { id: 3, coins: 500, price: 500, discount: true },
]

export default function WalletPopup({ open, onOpenChange }) {
  const { toast } = useToast()
  const { data, mutate } = useSWR("/api/wallet", fetcher, { revalidateOnFocus: false })
  const [isProcessing, setIsProcessing] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  const coins = data?.coins || 0
  const walletEnabled = data?.walletEnabled === true
  const razorpayEnabled = data?.razorpayEnabled === true
  const aiCost = Math.max(10, Number(data?.aiImageCostCoins) || 10)
  const needReels = data?.reelsRequiredBeforePaidAi ?? 5
  const reelCount = data?.reelsUploaded ?? 0

  useEffect(() => {
    if (!walletEnabled || !razorpayEnabled) return
    if (typeof window === "undefined") return
    if (window.Razorpay) {
      setRazorpayLoaded(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => setRazorpayLoaded(true)
    document.body.appendChild(script)
  }, [walletEnabled, razorpayEnabled, open])

  const handleRecharge = async (pkg) => {
    if (!razorpayLoaded || typeof window === "undefined" || !window.Razorpay) {
      toast({
        title: "Payment loading",
        description: "Wait a moment for Razorpay to load, then try again.",
      })
      return
    }

    setIsProcessing(true)
    try {
      const orderRes = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: pkg.price, coins: pkg.coins }),
        credentials: "include",
      })
      const orderData = await orderRes.json()
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "ColorKode",
        description: `${pkg.coins} Coins recharge`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/wallet/recharge", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: pkg.price,
                coins: pkg.coins,
              }),
              credentials: "include",
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              toast({
                title: "Recharge successful",
                description: `${pkg.coins} coins added to your wallet`,
              })
              mutate()
              onOpenChange(false)
            } else {
              throw new Error(verifyData.error || "Verification failed")
            }
          } catch (err) {
            toast({
              title: "Payment error",
              description: err.message,
              variant: "destructive",
            })
          }
        },
        prefill: { name: "ColorKode User" },
        theme: { color: "#c9424a" },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Could not start payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const pricingLine = `2 starter AI images free. After that, upload ${needReels} reels (you: ${reelCount}/${needReels}) to unlock paid AI at ${aiCost} coins each. Reels: free upload, +2 coins. Post to feed: always free, +1 coin.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white rounded-3xl border-none focus:outline-none">
        <DialogTitle className="sr-only">Wallet</DialogTitle>
        <DialogDescription className="sr-only">Balance and recharge</DialogDescription>

        <div className="bg-gradient-to-r from-[#c9424a] to-[#a0353b] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Wallet
              </h2>
              <p className="text-white/80 text-sm mt-1">Balance & recharge</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Available coins</p>
                <p className="text-3xl font-bold">{coins}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!walletEnabled ? (
            <div className="rounded-2xl border border-[#c9424a]/20 bg-[#c9424a]/5 p-4 text-sm text-[#4a181b]">
              <p className="font-semibold text-[#2d0f11] mb-1">Wallet is off</p>
              <p className="text-[#a0353b]">Admin can enable the wallet under Admin → App settings.</p>
            </div>
          ) : !razorpayEnabled ? (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-[#4a181b]">
                <p className="font-semibold text-[#2d0f11] mb-1">Razorpay is off</p>
                <p className="text-[#a0353b]">
                  Admin can turn on Razorpay in App settings. You can still earn coins from reels and image posts.
                </p>
              </div>
              <div className="bg-[#c9424a]/5 rounded-xl p-4">
                <p className="font-bold text-[#4a181b] mb-1">How pricing works</p>
                <p className="text-sm text-[#a0353b]">{pricingLine}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold text-[#2d0f11]">Recharge</h3>
                <p className="text-xs text-[#a0353b] font-medium">Min. ₹50</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {RECHARGE_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleRecharge(pkg)}
                    disabled={isProcessing}
                    className={`relative p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                      pkg.popular
                        ? "border-[#c9424a] bg-[#c9424a]/5"
                        : "border-[#c9424a]/30 hover:border-[#c9424a]"
                    } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c9424a] text-white text-xs px-3 py-1 rounded-full font-bold">
                        POPULAR
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#c9424a]">{pkg.coins}</p>
                      <p className="text-xs text-[#4a181b]">Coins</p>
                      <p className="text-lg font-bold text-[#4a181b] mt-2">₹{pkg.price}</p>
                    </div>
                  </button>
                ))}
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#c9424a]" />
                  <span className="text-sm text-[#c9424a] font-medium">Opening checkout…</span>
                </div>
              )}
              <div className="bg-[#c9424a]/5 rounded-xl p-4">
                <p className="font-bold text-[#4a181b] mb-1">Pricing</p>
                <p className="text-sm text-[#a0353b]">{pricingLine}</p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Reel +2 coins</span>
            </div>
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Image post +1</span>
            </div>
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Reels always free</span>
            </div>
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Razorpay = admin toggle</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
