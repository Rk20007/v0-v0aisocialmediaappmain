import { ObjectId } from "mongodb"
import { getAppSettings } from "@/lib/app-settings"
import {
  STARTER_FREE_AI_BASE,
  REELS_REQUIRED_BEFORE_PAID_AI,
  PAID_AI_MIN_COINS,
} from "@/lib/image-quota"

function coinHistoryEntry(partial) {
  return {
    type: partial.type,
    coins: partial.coins,
    description: partial.description,
    date: new Date(),
    ...partial.extra,
  }
}

/** Feed posts never cost coins; users earn +1 in /api/posts when wallet is on. */
export async function chargePostIfNeeded(_db, _sessionUserId) {
  return { success: true, skipped: true, noCharge: true }
}

/** Reel uploads never deduct coins; rewards are applied in /api/reels */
export async function chargeReelIfNeeded(_db, _sessionUserId) {
  return { success: true, skipped: true, reelsAlwaysFree: true }
}

function paidAiImageCost(settings) {
  const raw = Number(settings.aiImageCostCoins)
  const n = Number.isFinite(raw) && raw > 0 ? raw : PAID_AI_MIN_COINS
  return Math.max(PAID_AI_MIN_COINS, n)
}

export function reelsRequired(settings) {
  const raw = Number(settings.reelsRequiredBeforePaidAi)
  return Number.isFinite(raw) && raw > 0 ? raw : REELS_REQUIRED_BEFORE_PAID_AI
}

/**
 * Wallet off → no charge.
 * Wallet on → 2 lifetime starter free images, then user must upload enough reels before paid AI;
 * then each paid generation costs at least PAID_AI_MIN_COINS (10) coins.
 */
export async function chargeAiImageIfNeeded(db, sessionUserId) {
  const settings = await getAppSettings(db)
  if (!settings.walletEnabled) {
    return {
      success: true,
      skipped: true,
      walletEnabled: false,
      message: "Wallet off — no charge",
    }
  }

  const cost = paidAiImageCost(settings)
  const needReels = reelsRequired(settings)
  const users = db.collection("users")
  const userId = new ObjectId(sessionUserId)

  const user = await users.findOne(
    { _id: userId },
    {
      projection: {
        coins: 1,
        freeImagesUsed: 1,
        starterAiBonusSlots: 1,
      },
    }
  )

  if (!user) {
    return { success: false, error: "User not found" }
  }

  const starterCap = STARTER_FREE_AI_BASE + (user.starterAiBonusSlots || 0)
  const starterUsed = user.freeImagesUsed || 0

  if (starterUsed < starterCap) {
    await users.updateOne(
      { _id: userId },
      {
        $inc: { freeImagesUsed: 1 },
        $push: {
          coinHistory: coinHistoryEntry({
            type: "free_image",
            coins: 0,
            description: "Starter free AI image",
          }),
        },
      }
    )
    const updated = await users.findOne(
      { _id: userId },
      { projection: { coins: 1, freeImagesUsed: 1 } }
    )
    const newStarterLeft = Math.max(0, starterCap - (updated.freeImagesUsed || 0))
    return {
      success: true,
      usedStarterFree: true,
      coins: updated.coins,
      starterFreeAiLeft: newStarterLeft,
      starterFreeAiTotal: starterCap,
      dailyFreeAiLeft: 0,
      dailyFreeAiTotal: 0,
    }
  }

  const reelsUploaded = await db.collection("reels").countDocuments({ userId: userId })
  if (reelsUploaded < needReels) {
    return {
      success: false,
      error: "REELS_GATE",
      message: `Upload at least ${needReels} reels to unlock paid AI images (you have ${reelsUploaded}).`,
      reelsUploaded,
      reelsRequiredBeforePaidAi: needReels,
      requiredCoins: cost,
      currentCoins: user.coins,
      starterFreeAiLeft: 0,
      starterFreeAiTotal: starterCap,
    }
  }

  if (user.coins < cost) {
    return {
      success: false,
      error: "Insufficient coins",
      requiredCoins: cost,
      currentCoins: user.coins,
      reelsUploaded,
      reelsRequiredBeforePaidAi: needReels,
      dailyFreeAiLeft: 0,
      dailyFreeAiTotal: 0,
      starterFreeAiLeft: 0,
      starterFreeAiTotal: starterCap,
    }
  }

  const result = await users.findOneAndUpdate(
    { _id: userId, coins: { $gte: cost } },
    {
      $inc: { coins: -cost },
      $push: {
        coinHistory: coinHistoryEntry({
          type: "deduct",
          coins: -cost,
          description: "AI image generation",
        }),
      },
    },
    { returnDocument: "after", projection: { coins: 1 } }
  )

  if (!result.value) {
    return {
      success: false,
      error: "Insufficient coins",
      requiredCoins: cost,
      currentCoins: user.coins,
      starterFreeAiTotal: starterCap,
      reelsUploaded,
      reelsRequiredBeforePaidAi: needReels,
    }
  }

  return {
    success: true,
    usedDailyFree: false,
    coins: result.value.coins,
    charged: cost,
    dailyFreeAiLeft: 0,
    dailyFreeAiTotal: 0,
    starterFreeAiLeft: 0,
    starterFreeAiTotal: starterCap,
    reelsUploaded,
    reelsRequiredBeforePaidAi: needReels,
  }
}

export function starterAiRemaining(userDoc, settings) {
  if (!settings.walletEnabled) {
    return {
      starterFreeAiLeft: STARTER_FREE_AI_BASE,
      starterFreeAiTotal: STARTER_FREE_AI_BASE,
      starterUnlimitedWhileWalletOff: true,
    }
  }
  const bonus = userDoc?.starterAiBonusSlots || 0
  const cap = STARTER_FREE_AI_BASE + bonus
  const used = userDoc?.freeImagesUsed || 0
  return {
    starterFreeAiLeft: Math.max(0, cap - used),
    starterFreeAiTotal: cap,
    starterUnlimitedWhileWalletOff: false,
  }
}

/** Daily free AI is disabled in billing; UI may still read zeros when wallet is on. */
export function dailyAiFreeRemaining(userDoc, settings) {
  if (!settings.walletEnabled) {
    return {
      dailyFreeAiLeft: 0,
      dailyFreeAiTotal: 0,
      aiUnlimitedWhileWalletOff: true,
    }
  }
  return {
    dailyFreeAiLeft: 0,
    dailyFreeAiTotal: 0,
    aiUnlimitedWhileWalletOff: false,
  }
}
