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

    const { friendId } = await request.json()

    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const friendObjId = new ObjectId(friendId)

    await db.collection("users").updateOne({ _id: userId }, { $pull: { friends: friendObjId } })

    await db.collection("users").updateOne({ _id: friendObjId }, { $pull: { friends: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove friend error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
