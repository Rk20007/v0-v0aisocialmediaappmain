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
    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const postId = new ObjectId(id)

    const post = await db.collection("posts").findOne({ _id: postId })
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    const hasLiked = post.likes.some((likeId) => likeId.toString() === session.userId)

    if (hasLiked) {
      await db.collection("posts").updateOne({ _id: postId }, { $pull: { likes: userId } })
    } else {
      await db.collection("posts").updateOne({ _id: postId }, { $push: { likes: userId } })
    }

    return NextResponse.json({ success: true, liked: !hasLiked })
  } catch (error) {
    console.error("Like error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
