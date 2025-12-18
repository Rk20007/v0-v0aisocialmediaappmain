import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId) })

    const requestIds = user.friendRequests?.map((id) => new ObjectId(id)) || []

    const requests = await db
      .collection("users")
      .find({ _id: { $in: requestIds } }, { projection: { password: 0 } })
      .toArray()

    const serializedRequests = requests.map((r) => ({
      ...r,
      _id: r._id.toString(),
    }))

    return NextResponse.json({ success: true, requests: serializedRequests })
  } catch (error) {
    console.error("Get friend requests error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { targetUserId } = await request.json()
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Target user ID required" }, { status: 400 })
    }

    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const targetId = new ObjectId(targetUserId)

    // Add to target's friend requests
    await db.collection("users").updateOne({ _id: targetId }, { $addToSet: { friendRequests: userId } })

    // Add to sender's sent requests
    await db.collection("users").updateOne({ _id: userId }, { $addToSet: { sentRequests: targetId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send friend request error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
