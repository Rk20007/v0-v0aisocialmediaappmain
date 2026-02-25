"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Wallet, Zap, CheckCircle2, X } from "lucide-react"
import useSWR from "swr"

const fetcher = (url) => fetch(url, { credentials: "include" }).then((res) => res.json())

const RECHARGE_PACKAGES = [
  { id: 1, coins: 100, price: 100, popular: false },
  { id: 2, coins: 500, price: 500, popular: true },
  { id: 3, coins: 1000, price: 900, discount: true },
]

export default function WalletPopup({ open, onOpenChange }) {
  const { toast } = useToast()
  const { data, mutate } = useSWR("/api/wallet", fetcher, { revalidateOnFocus: false })
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  const coins = data?.coins || 0

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => setRazorpayLoaded(true)
      document.body.appendChild(script)
    } else if (window.Razorpay) {
      setRazorpayLoaded(true)
    }
  }, [])

  const handleRecharge = async (pkg) => {
    if (!razorpayLoaded) {
      toast({
        title: "Payment System Loading",
        description: "Please wait a moment...",
      })
      return
    }

    setSelectedPackage(pkg)
    setIsProcessing(true)

    try {
      // Create order
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

      // Open Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "ColorCode",
        description: `${pkg.coins} Coins Recharge`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment
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
                title: "🎉 Recharge Successful!",
                description: `${pkg.coins} coins added to your wallet`,
              })
              mutate()
              onOpenChange(false)
            } else {
              throw new Error(verifyData.error || "Payment verification failed")
            }
          } catch (err) {
            toast({
              title: "Payment Error",
              description: err.message,
              variant: "destructive",
            })
          }
        },
        prefill: {
          name: "ColorCode User",
        },
        theme: {
          color: "#c9424a",
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setSelectedPackage(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white rounded-3xl border-none focus:outline-none">
        <DialogTitle className="sr-only">Wallet Recharge</DialogTitle>
        <DialogDescription className="sr-only">Recharge your wallet with coins</DialogDescription>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#c9424a] to-[#a0353b] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Wallet
              </h2>
              <p className="text-white/80 text-sm mt-1">Recharge your coins</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Current Balance */}
          <div className="mt-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Available Coins</p>
                <p className="text-3xl font-bold">{coins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recharge Packages */}
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-[#2d0f11]">Select Package</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {RECHARGE_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleRecharge(pkg)}
                disabled={isProcessing}
                className={`relative p-4 rounded-2xl border-2 transition-all hover:scale-105 ${
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
                {pkg.discount && (
                  <div className="absolute -top-3 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    10% OFF
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#c9424a]">{pkg.coins}</p>
                  <p className="text-xs text-[#4a181b]">Coins</p>
                  <p className="text-lg font-bold text-[#4a181b] mt-2">₹{pkg.price}</p>
                  {pkg.discount && (
                    <p className="text-xs text-green-600 line-through">₹{pkg.coins}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Per Image Cost Info */}
          <div className="bg-[#c9424a]/5 rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[#4a181b]">Cost per image</p>
                <p className="text-sm text-[#a0353b]">20 coins per AI generation</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#c9424a] flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[#c9424a]" />
              <span className="text-[#c9424a] font-medium">Processing Payment...</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Instant delivery</span>
            </div>
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No expiry</span>
            </div>
            <div className="flex items-center gap-2 text-[#4a181b]">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
