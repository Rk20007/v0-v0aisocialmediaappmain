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

    const { content, imageUrl, caption, tags } = await request.json()

    const db = await getDb()

    const post = {
      _id: new ObjectId(),
      userId: new ObjectId(session.userId),
      content: content || "",
      imageUrl: imageUrl || "",
      caption: caption || "",
      tags: tags || [],
      likes: [],
      comments: [],
      shares: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("posts").insertOne(post)

    // Get user info for the response
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { name: 1, avatar: 1 } })

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        _id: post._id.toString(),
        userId: post.userId.toString(),
        user: { ...user, _id: user._id.toString() },
      },
    })
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const db = await getDb()

    const query = {}

    if (userId) {
      query.userId = new ObjectId(userId)
    }

    const posts = await db
      .collection("posts")
      .aggregate([
        { $match: query },
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

    const serializedPosts = posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      userId: post.userId.toString(),
      user: { ...post.user, _id: post.user._id.toString() },
      likes: post.likes.map((id) => id.toString()),
      comments: post.comments.map((c) => ({
        ...c,
        _id: c._id?.toString(),
        userId: c.userId?.toString(),
      })),
    }))

    return NextResponse.json({ success: true, posts: serializedPosts })
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
