import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Mark messages as read
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { friendId } = await request.json()

    if (!friendId) {
      return NextResponse.json({ success: false, error: "Friend ID required" }, { status: 400 })
    }

    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const friendObjId = new ObjectId(friendId)

    // Mark all messages from this friend as read
    await db.collection("messages").updateMany(
      {
        senderId: friendObjId,
        receiverId: userId,
        read: false,
      },
      {
        $set: { read: true },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Mark read error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
