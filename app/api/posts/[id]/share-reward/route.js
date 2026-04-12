import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { getAppSettings, publicAppSettings } from "@/lib/app-settings"

/**
 * One-time bonus after the user completes the system share sheet right after creating a post.
 * Does not run on its own — client calls this only after a successful navigator.share().
 */
export async function POST(_request, { params }) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid post" }, { status: 400 })
    }

    const db = await getDb()
    const settings = await getAppSettings(db)
    const pub = publicAppSettings(settings)
    const bonusCoins = pub.postShareBonusCoins ?? 5

    if (!settings.walletEnabled || bonusCoins <= 0) {
      return NextResponse.json({ success: false, error: "Share bonus disabled" }, { status: 403 })
    }

    const posts = db.collection("posts")
    const users = db.collection("users")
    const pid = new ObjectId(id)
    const uid = new ObjectId(session.userId)

    const claim = await posts.findOneAndUpdate(
      {
        _id: pid,
        userId: uid,
        $or: [{ shareRewardClaimed: { $exists: false } }, { shareRewardClaimed: false }],
      },
      { $set: { shareRewardClaimed: true, shareRewardAt: new Date() } },
      { returnDocument: "after" }
    )

    if (!claim.value) {
      const post = await posts.findOne({ _id: pid })
      if (!post) {
        return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
      }
      if (post.userId.toString() !== session.userId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.json({ success: false, error: "Already claimed" }, { status: 409 })
    }

    const updated = await users.findOneAndUpdate(
      { _id: uid },
      {
        $inc: { coins: bonusCoins },
        $push: {
          coinHistory: {
            type: "bonus",
            coins: bonusCoins,
            description: "Share bonus (after new post)",
            date: new Date(),
          },
        },
      },
      { returnDocument: "after", projection: { coins: 1 } }
    )

    return NextResponse.json({
      success: true,
      coins: updated.value?.coins ?? 0,
      bonusCoins,
    })
  } catch (error) {
    console.error("[posts/share-reward]", error.message)
    return NextResponse.json({ success: false, error: "Failed to grant bonus" }, { status: 500 })
  }
}
