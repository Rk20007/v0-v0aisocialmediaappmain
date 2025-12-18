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
    const reelId = new ObjectId(id)

    const reel = await db.collection("reels").findOne({ _id: reelId })
    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 })
    }

    const hasLiked = reel.likes?.some((id) => id.toString() === session.userId)

    if (hasLiked) {
      await db.collection("reels").updateOne({ _id: reelId }, { $pull: { likes: userId } })
    } else {
      await db.collection("reels").updateOne({ _id: reelId }, { $addToSet: { likes: userId } })
    }

    return NextResponse.json({ success: true, liked: !hasLiked })
  } catch (error) {
    console.error("Like reel error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
