"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Wallet, CreditCard } from "lucide-react"

export default function AdminAppSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    walletEnabled: false,
    razorpayEnabled: false,
    postCostCoins: 0,
    reelCostCoins: 0,
    aiImageCostCoins: 10,
    dailyFreeAiImages: 0,
    postShareBonusCoins: 0,
    reelsRequiredBeforePaidAi: 5,
  })

  useEffect(() => {
    fetch("/api/admin/app-settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) {
          setForm((prev) => ({ ...prev, ...d.settings }))
        } else {
          setError(d.error || "Failed to load")
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/app-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!data.success) {
      setError(data.error || "Save failed")
      return
    }
    if (data.settings) {
      setForm((prev) => ({ ...prev, ...data.settings }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9424a]" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Feed posts never cost coins and earn +1 coin. After 2 free AI images, users must upload the configured number
          of reels before paid AI unlocks; then each image costs at least 10 coins. Reels are free to upload and earn +2
          coins each.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={form.walletEnabled}
            onChange={(e) => setForm((f) => ({ ...f, walletEnabled: e.target.checked }))}
          />
          <div>
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Wallet className="h-4 w-4 text-yellow-600" />
              Enable wallet (coin economy + AI rules)
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Off = no coin charges for AI. On = 2 lifetime starter free AI only, then at least 10 coins per paid
              generation (uses AI cost below, floored at 10). No daily free images in billing.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer border-t border-gray-100 pt-6">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={form.razorpayEnabled}
            onChange={(e) => setForm((f) => ({ ...f, razorpayEnabled: e.target.checked }))}
            disabled={!form.walletEnabled}
          />
          <div>
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Enable Razorpay recharge
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Requires wallet on and <code className="text-xs bg-gray-100 px-1 rounded">RAZORPAY_*</code> env keys.
              Off = in-app wallet shows balance only; no checkout.
            </p>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Post cost (0 = free)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.postCostCoins}
              onChange={(e) => setForm((f) => ({ ...f, postCostCoins: parseInt(e.target.value, 10) || 0 }))}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Keep 0 so posting stays free; image posts still earn +1 coin.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Reel cost (ignored)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.reelCostCoins}
              onChange={(e) => setForm((f) => ({ ...f, reelCostCoins: parseInt(e.target.value, 10) || 0 }))}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Uploads always free; +2 coins reward each time.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">AI cost after starter</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.aiImageCostCoins}
              onChange={(e) => setForm((f) => ({ ...f, aiImageCostCoins: parseInt(e.target.value, 10) || 0 }))}
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Charged amount is max(10, this value) per paid generation.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Share bonus after new post</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.postShareBonusCoins}
              onChange={(e) =>
                setForm((f) => ({ ...f, postShareBonusCoins: parseInt(e.target.value, 10) || 0 }))
              }
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              Extra coins after native share post-create (0 = off). Normal post reward is always +1 coin, free.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Reels before paid AI</label>
            <input
              type="number"
              min={0}
              max={50}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={form.reelsRequiredBeforePaidAi}
              onChange={(e) =>
                setForm((f) => ({ ...f, reelsRequiredBeforePaidAi: parseInt(e.target.value, 10) || 0 }))
              }
            />
            <p className="text-[10px] text-gray-400 mt-0.5">
              After starter free AI is used, user needs this many reel uploads (lifetime count) to unlock coin-paid AI.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9424a] text-white font-semibold text-sm hover:bg-[#a0353b] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
      </div>
    </div>
  )
}
