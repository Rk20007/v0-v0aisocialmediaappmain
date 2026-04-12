import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { APP_SETTINGS_ID, getAppSettings, publicAppSettings } from "@/lib/app-settings"

export async function GET() {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const settings = await getAppSettings(db)
    return NextResponse.json({
      success: true,
      settings: publicAppSettings(settings),
    })
  } catch (e) {
    console.error("[admin] app-settings GET:", e.message)
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PATCH(request) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const col = db.collection("app_settings")

    const allowed = {}
    if (typeof body.walletEnabled === "boolean") {
      allowed.walletEnabled = body.walletEnabled
    }
    if (typeof body.razorpayEnabled === "boolean") {
      allowed.razorpayEnabled = body.razorpayEnabled
    }
    if (body.postCostCoins !== undefined) {
      const n = parseInt(body.postCostCoins, 10)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ success: false, error: "Invalid postCostCoins" }, { status: 400 })
      }
      allowed.postCostCoins = n
    }
    if (body.reelCostCoins !== undefined) {
      const n = parseInt(body.reelCostCoins, 10)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ success: false, error: "Invalid reelCostCoins" }, { status: 400 })
      }
      allowed.reelCostCoins = n
    }
    if (body.aiImageCostCoins !== undefined) {
      const n = parseInt(body.aiImageCostCoins, 10)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ success: false, error: "Invalid aiImageCostCoins" }, { status: 400 })
      }
      allowed.aiImageCostCoins = n
    }
    if (body.dailyFreeAiImages !== undefined) {
      const n = parseInt(body.dailyFreeAiImages, 10)
      if (!Number.isFinite(n) || n < 0 || n > 50) {
        return NextResponse.json({ success: false, error: "Invalid dailyFreeAiImages (0–50)" }, { status: 400 })
      }
      allowed.dailyFreeAiImages = n
    }
    if (body.postShareBonusCoins !== undefined) {
      const n = parseInt(body.postShareBonusCoins, 10)
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return NextResponse.json({ success: false, error: "Invalid postShareBonusCoins (0–100)" }, { status: 400 })
      }
      allowed.postShareBonusCoins = n
    }
    if (body.reelsRequiredBeforePaidAi !== undefined) {
      const n = parseInt(body.reelsRequiredBeforePaidAi, 10)
      if (!Number.isFinite(n) || n < 0 || n > 50) {
        return NextResponse.json({ success: false, error: "Invalid reelsRequiredBeforePaidAi (0–50)" }, { status: 400 })
      }
      allowed.reelsRequiredBeforePaidAi = n
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 })
    }

    allowed.updatedAt = new Date()

    await col.updateOne({ _id: APP_SETTINGS_ID }, { $set: allowed }, { upsert: true })

    const settings = await getAppSettings(db)
    return NextResponse.json({
      success: true,
      settings: publicAppSettings(settings),
    })
  } catch (e) {
    console.error("[admin] app-settings PATCH:", e.message)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}
