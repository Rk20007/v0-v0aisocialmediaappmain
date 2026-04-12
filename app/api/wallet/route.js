import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getAppSettings, publicAppSettings } from "@/lib/app-settings"
import { dailyAiFreeRemaining, starterAiRemaining, reelsRequired } from "@/lib/wallet-charges"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const users = db.collection("users")
    const settings = await getAppSettings(db)

    const userId = typeof session.userId === 'string' ? new ObjectId(session.userId) : session.userId

    const user = await users.findOne(
      { _id: userId },
      {
        projection: {
          coins: 1,
          coinHistory: 1,
          freeImagesUsed: 1,
          dailyAiFreeDate: 1,
          dailyAiFreeUsed: 1,
          starterAiBonusSlots: 1,
        },
      }
    )

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const pub = publicAppSettings(settings)
    const { dailyFreeAiLeft, dailyFreeAiTotal, aiUnlimitedWhileWalletOff } = dailyAiFreeRemaining(user, settings)
    const {
      starterFreeAiLeft,
      starterFreeAiTotal,
      starterUnlimitedWhileWalletOff,
    } = starterAiRemaining(user, settings)

    const needReels = reelsRequired(settings)
    const reelsUploaded = await db.collection("reels").countDocuments({ userId })

    return NextResponse.json({
      success: true,
      coins: user.coins || 0,
      coinHistory: user.coinHistory || [],
      freeImagesUsed: user.freeImagesUsed || 0,
      reelsUploaded,
      reelsRequiredBeforePaidAi: needReels,
      ...pub,
      dailyAiFreeDate: user.dailyAiFreeDate || null,
      dailyAiFreeUsed: user.dailyAiFreeUsed || 0,
      dailyFreeAiLeft,
      dailyFreeAiTotal,
      aiUnlimitedWhileWalletOff,
      starterFreeAiLeft,
      starterFreeAiTotal,
      starterUnlimitedWhileWalletOff,
    })
  } catch (error) {
    console.error("[v0] Get wallet error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to get wallet" }, { status: 500 })
  }
}
