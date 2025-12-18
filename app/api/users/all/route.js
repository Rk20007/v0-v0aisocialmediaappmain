import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

// API to get all users except current user
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    // Get current user to check friends and sent requests
    const currentUser = await db.collection("users").findOne({ _id: new ObjectId(session.userId) })
    const friendIds = currentUser?.friends?.map((id) => id.toString()) || []
    const sentRequestIds = currentUser?.sentRequests?.map((id) => id.toString()) || []
    const receivedRequestIds = currentUser?.friendRequests?.map((id) => id.toString()) || []

    // Get all users except current user
    const users = await db
      .collection("users")
      .find({ _id: { $ne: new ObjectId(session.userId) } }, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    const serializedUsers = users.map((u) => ({
      ...u,
      _id: u._id.toString(),
      isFriend: friendIds.includes(u._id.toString()),
      requestSent: sentRequestIds.includes(u._id.toString()),
      requestReceived: receivedRequestIds.includes(u._id.toString()),
    }))

    return NextResponse.json({ success: true, users: serializedUsers })
  } catch (error) {
    console.error("Get all users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
