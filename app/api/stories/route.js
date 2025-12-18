import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET - Fetch all active stories (within 24 hours)
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get all active stories grouped by user
    const stories = await db
      .collection("stories")
      .aggregate([
        { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
        { $sort: { createdAt: -1 } },
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
        {
          $group: {
            _id: "$userId",
            user: { $first: "$user" },
            stories: { $push: "$$ROOT" },
            lastUpdated: { $max: "$createdAt" },
          },
        },
        { $sort: { lastUpdated: -1 } },
      ])
      .toArray()

    const serializedStories = stories.map((group) => ({
      userId: group._id.toString(),
      user: { ...group.user, _id: group.user._id.toString() },
      stories: group.stories.map((s) => ({
        _id: s._id.toString(),
        userId: s.userId.toString(),
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        views: s.views?.length || 0,
        createdAt: s.createdAt,
      })),
      lastUpdated: group.lastUpdated,
    }))

    return NextResponse.json({ success: true, stories: serializedStories })
  } catch (error) {
    console.error("Get stories error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new story
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { mediaUrl, mediaType, caption } = await request.json()

    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ success: false, error: "Media URL and type required" }, { status: 400 })
    }

    const db = await getDb()

    const story = {
      _id: new ObjectId(),
      userId: new ObjectId(session.userId),
      mediaUrl,
      mediaType, // 'image' or 'video'
      caption: caption || "",
      views: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    await db.collection("stories").insertOne(story)

    // Get user info
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { name: 1, avatar: 1 } })

    return NextResponse.json({
      success: true,
      story: {
        ...story,
        _id: story._id.toString(),
        userId: story.userId.toString(),
        user: { ...user, _id: user._id.toString() },
      },
    })
  } catch (error) {
    console.error("Create story error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
