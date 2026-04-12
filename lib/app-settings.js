/**
 * Global app settings stored in MongoDB `app_settings` collection.
 * `walletEnabled: false` disables paid wallet flows until an admin turns it on.
 */

export const APP_SETTINGS_ID = "global"

export const DEFAULT_APP_SETTINGS = {
  _id: APP_SETTINGS_ID,
  walletEnabled: false,
  /** Razorpay checkout — only active when wallet is also on */
  razorpayEnabled: false,
  /** 0 = no charge to post; image posts earn +1 coin */
  postCostCoins: 0,
  /** Ignored for uploads — reels are always free (+2 coin reward each) */
  reelCostCoins: 0,
  /** After 2 starter free AI images only, each paid generation costs this many coins (min 10 when wallet is on) */
  aiImageCostCoins: 10,
  /** Legacy field — daily free AI is not used; only 2 lifetime starter free images */
  dailyFreeAiImages: 0,
  /** Optional extra coins after native share post-create (0 = off; feed post always gives +1) */
  postShareBonusCoins: 0,
  /** After starter free AI is used, user needs this many reel uploads before paid AI */
  reelsRequiredBeforePaidAi: 5,
}

export function mergeAppSettings(doc) {
  return {
    ...DEFAULT_APP_SETTINGS,
    ...doc,
    _id: APP_SETTINGS_ID,
  }
}

/** UTC calendar date YYYY-MM-DD */
export function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export async function getAppSettings(db) {
  const col = db.collection("app_settings")
  let doc = await col.findOne({ _id: APP_SETTINGS_ID })
  if (!doc) {
    const initial = { ...DEFAULT_APP_SETTINGS, updatedAt: new Date() }
    await col.insertOne(initial)
    doc = initial
  }
  return mergeAppSettings(doc)
}

export function publicAppSettings(settings) {
  return {
    walletEnabled: !!settings.walletEnabled,
    razorpayEnabled: !!settings.razorpayEnabled,
    postCostCoins: settings.postCostCoins ?? DEFAULT_APP_SETTINGS.postCostCoins,
    reelCostCoins: settings.reelCostCoins ?? DEFAULT_APP_SETTINGS.reelCostCoins,
    aiImageCostCoins: settings.aiImageCostCoins ?? DEFAULT_APP_SETTINGS.aiImageCostCoins,
    dailyFreeAiImages: settings.dailyFreeAiImages ?? DEFAULT_APP_SETTINGS.dailyFreeAiImages,
    postShareBonusCoins: settings.postShareBonusCoins ?? DEFAULT_APP_SETTINGS.postShareBonusCoins,
    reelsRequiredBeforePaidAi:
      settings.reelsRequiredBeforePaidAi ?? DEFAULT_APP_SETTINGS.reelsRequiredBeforePaidAi,
  }
}
