import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.userId) })

    const friendIds = user.friends?.map((id) => new ObjectId(id)) || []

    const friends = await db
      .collection("users")
      .find({ _id: { $in: friendIds } }, { projection: { password: 0 } })
      .toArray()

    const serializedFriends = friends.map((f) => ({
      ...f,
      _id: f._id.toString(),
    }))

    return NextResponse.json({ success: true, friends: serializedFriends })
  } catch (error) {
    console.error("Get friends error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
