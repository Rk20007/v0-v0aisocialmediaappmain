import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { chargeReelIfNeeded } from "@/lib/wallet-charges"
import { getAppSettings } from "@/lib/app-settings"

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { videoUrl, caption, thumbnail } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "Video URL required" }, { status: 400 })
    }

    const db = await getDb()

    const charge = await chargeReelIfNeeded(db, session.userId)
    if (!charge.success) {
      return NextResponse.json(
        {
          success: false,
          error: charge.error || "Insufficient coins",
          requiredCoins: charge.requiredCoins,
          currentCoins: charge.currentCoins,
        },
        { status: 402 }
      )
    }

    const reel = {
      _id: new ObjectId(),
      userId: new ObjectId(session.userId),
      videoUrl,
      thumbnail: thumbnail || "",
      caption: caption || "",
      likes: [],
      comments: [],
      views: 0,
      createdAt: new Date(),
    }

    await db.collection("reels").insertOne(reel)

    const appSettings = await getAppSettings(db)
    if (appSettings.walletEnabled) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(session.userId) },
        {
          $inc: { coins: 2 },
          $push: {
            coinHistory: {
              type: "bonus",
              coins: 2,
              description: "Reel upload reward",
              date: new Date(),
            },
          },
        }
      )
    }

    return NextResponse.json({
      success: true,
      reel: {
        ...reel,
        _id: reel._id.toString(),
        userId: reel.userId.toString(),
      },
    })
  } catch (error) {
    console.error("Create reel error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const db = await getDb()

    const reels = await db
      .collection("reels")
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { name: 1, avatar: 1 } }],
          },
        },
        { $unwind: "$user" },
      ])
      .toArray()

    const sessionUserId = session?.userId ? String(session.userId) : ""

    const serializedReels = reels.map((reel) => {
      const authorId = reel.userId.toString()
      return {
        ...reel,
        _id: reel._id.toString(),
        userId: authorId,
        user: { ...reel.user, _id: reel.user._id.toString() },
        likes: reel.likes.map((id) => id.toString()),
        isOwner: Boolean(sessionUserId) && authorId === sessionUserId,
      }
    })

    return NextResponse.json({ success: true, reels: serializedReels })
  } catch (error) {
    console.error("Get reels error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reelId = searchParams.get("reelId")

    if (!reelId) {
      return NextResponse.json({ success: false, error: "Reel ID required" }, { status: 400 })
    }

    const db = await getDb()

    const result = await db.collection("reels").deleteOne({
      _id: new ObjectId(reelId),
      userId: new ObjectId(session.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Reel not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Reel deleted successfully" })
  } catch (error) {
    console.error("Delete reel error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
