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

    const { searchParams } = new URL(request.url)
    const friendId = searchParams.get("friendId")

    if (!friendId) {
      return NextResponse.json({ success: false, error: "Friend ID required" }, { status: 400 })
    }

    const db = await getDb()
    const userId = new ObjectId(session.userId)
    const friendObjId = new ObjectId(friendId)

    console.log("[v0] Fetching messages between", session.userId, "and", friendId)

    const messages = await db
      .collection("messages")
      .find({
        $or: [
          { senderId: userId, receiverId: friendObjId },
          { senderId: friendObjId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray()

    console.log("[v0] Found", messages.length, "messages")

    const serializedMessages = messages.map((m) => ({
      ...m,
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
    }))

    return NextResponse.json({ success: true, messages: serializedMessages })
  } catch (error) {
    console.error("[v0] Get messages error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { receiverId, content } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json({ success: false, error: "Receiver ID and content required" }, { status: 400 })
    }

    const db = await getDb()

    const message = {
      _id: new ObjectId(),
      senderId: new ObjectId(session.userId),
      receiverId: new ObjectId(receiverId),
      content: content.trim(),
      read: false,
      createdAt: new Date(),
    }

    console.log("[v0] Creating message from", session.userId, "to", receiverId)

    await db.collection("messages").insertOne(message)

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        _id: message._id.toString(),
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Send message error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
