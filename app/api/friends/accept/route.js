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

    const { requesterId } = await request.json()
    if (!requesterId) {
      return NextResponse.json({ success: false, error: "Requester ID required" }, { status: 400 })
    }

    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const requesterObjId = new ObjectId(requesterId)

    // Add each other as friends
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $addToSet: { friends: requesterObjId },
        $pull: { friendRequests: requesterObjId },
      },
    )

    await db.collection("users").updateOne(
      { _id: requesterObjId },
      {
        $addToSet: { friends: userId },
        $pull: { sentRequests: userId },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept friend request error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
