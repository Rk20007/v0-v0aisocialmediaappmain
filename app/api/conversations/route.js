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
    const userId = new ObjectId(session.userId)

    const conversations = await db
      .collection("messages")
      .aggregate([
        {
          $match: {
            $or: [{ senderId: userId }, { receiverId: userId }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
            },
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$receiverId", userId] }, { $eq: ["$read", false] }] }, 1, 0],
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { name: 1, avatar: 1 } }],
          },
        },
        { $unwind: "$user" },
        { $sort: { "lastMessage.createdAt": -1 } },
      ])
      .toArray()

    const serialized = conversations.map((c) => ({
      friendId: c._id.toString(),
      friend: { ...c.user, _id: c.user._id.toString() },
      lastMessage: {
        ...c.lastMessage,
        _id: c.lastMessage._id.toString(),
        senderId: c.lastMessage.senderId.toString(),
        receiverId: c.lastMessage.receiverId.toString(),
      },
      unreadCount: c.unreadCount || 0,
    }))

    return NextResponse.json({ success: true, conversations: serialized })
  } catch (error) {
    console.error("[v0] Get conversations error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
