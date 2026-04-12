import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { chargeAiImageIfNeeded } from "@/lib/wallet-charges"

/**
 * Deduct for AI image generation (after a successful generation).
 * Body: { purpose: "ai_image" } — coin amount comes from app settings + daily free rules.
 */
export async function POST(request) {
  try {
    const session = await getSession()

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const purpose = body.purpose || "ai_image"

    if (purpose !== "ai_image") {
      return NextResponse.json({ success: false, error: "Unsupported purpose" }, { status: 400 })
    }

    const db = await getDb()
    const result = await chargeAiImageIfNeeded(db, session.userId)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Charge failed",
          message: result.message,
          currentCoins: result.currentCoins,
          requiredCoins: result.requiredCoins,
          reelsUploaded: result.reelsUploaded,
          reelsRequiredBeforePaidAi: result.reelsRequiredBeforePaidAi,
          dailyFreeAiLeft: result.dailyFreeAiLeft,
          dailyFreeAiTotal: result.dailyFreeAiTotal,
          starterFreeAiLeft: result.starterFreeAiLeft,
          starterFreeAiTotal: result.starterFreeAiTotal,
        },
        { status: 400 }
      )
    }

    const message = result.skipped
      ? "No charge (wallet off)"
      : result.usedStarterFree
        ? "Starter free image used"
        : result.usedDailyFree
          ? "Daily free used"
          : "Coins deducted"

    return NextResponse.json({
      success: true,
      message,
      skipped: !!result.skipped,
      walletEnabled: result.walletEnabled !== false,
      coins: result.coins,
      usedStarterFree: !!result.usedStarterFree,
      usedDailyFree: !!result.usedDailyFree,
      charged: result.charged ?? 0,
      dailyFreeAiLeft: result.dailyFreeAiLeft,
      dailyFreeAiTotal: result.dailyFreeAiTotal,
      dailyAiFreeUsed: result.dailyAiFreeUsed,
      starterFreeAiLeft: result.starterFreeAiLeft,
      starterFreeAiTotal: result.starterFreeAiTotal,
      reelsUploaded: result.reelsUploaded,
      reelsRequiredBeforePaidAi: result.reelsRequiredBeforePaidAi,
    })
  } catch (error) {
    console.error("[v0] Deduct coins error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
  }
}
