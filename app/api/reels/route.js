import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

    const serializedReels = reels.map((reel) => ({
      ...reel,
      _id: reel._id.toString(),
      userId: reel.userId.toString(),
      user: { ...reel.user, _id: reel.user._id.toString() },
      likes: reel.likes.map((id) => id.toString()),
    }))

    return NextResponse.json({ success: true, reels: serializedReels })
  } catch (error) {
    console.error("Get reels error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
