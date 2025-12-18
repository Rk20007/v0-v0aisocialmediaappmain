import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request, { params }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 })
    }

    const db = await getDb()
    const postId = new ObjectId(id)

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { name: 1, avatar: 1 } })

    const comment = {
      _id: new ObjectId(),
      userId: new ObjectId(session.userId),
      userName: user.name,
      userAvatar: user.avatar,
      content,
      createdAt: new Date(),
    }

    await db.collection("posts").updateOne({ _id: postId }, { $push: { comments: comment } })

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        _id: comment._id.toString(),
        userId: comment.userId.toString(),
      },
    })
  } catch (error) {
    console.error("Comment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
