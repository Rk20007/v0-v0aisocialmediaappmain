import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getAppSettings } from "@/lib/app-settings"
/** Spend coins for one AI generation credit (same price floor as paid AI image from settings). */
export async function POST() {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const settings = await getAppSettings(db)
    if (!settings.walletEnabled) {
      return NextResponse.json(
        { success: false, error: "Wallet is off — redeem is only available when the admin enables the wallet." },
        { status: 403 }
      )
    }

    const raw = Number(settings.aiImageCostCoins)
    const n = Number.isFinite(raw) && raw > 0 ? raw : 10
    const redeemCost = Math.max(10, n)

    const users = db.collection("users")
    const userId = new ObjectId(session.userId)

    const result = await users.findOneAndUpdate(
      { _id: userId, coins: { $gte: redeemCost } },
      {
        $inc: { coins: -redeemCost, aiGenerationCredits: 1 },
        $push: {
          coinHistory: {
            type: "deduct",
            coins: -redeemCost,
            description: `Redeem ${redeemCost} coins → 1 AI image credit`,
            date: new Date(),
          },
        },
      },
      { returnDocument: "after", projection: { coins: 1, aiGenerationCredits: 1 } }
    )

    if (!result.value) {
      const u = await users.findOne({ _id: userId }, { projection: { coins: 1 } })
      return NextResponse.json(
        {
          success: false,
          error: "Not enough coins",
          requiredCoins: redeemCost,
          currentCoins: u?.coins ?? 0,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      coins: result.value.coins,
      aiGenerationCredits: result.value.aiGenerationCredits || 0,
      message: `Redeemed ${redeemCost} coins for 1 AI credit`,
    })
  } catch (error) {
    console.error("[wallet] redeem-ai-credit:", error.message)
    return NextResponse.json({ success: false, error: "Redeem failed" }, { status: 500 })
  }
}
