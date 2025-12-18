import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request, { params }) {
  try {
    const { userId } = await params

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const db = await getDb()
    const session = await getSession()

    // Get the user
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get user's posts
    const posts = await db
      .collection("posts")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // Get user's reels
    const reels = await db
      .collection("reels")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray()

    // Check relationship with current user
    let relationship = "none"
    if (session) {
      const currentUser = await db.collection("users").findOne({ _id: new ObjectId(session.userId) })
      const friendIds = currentUser?.friends?.map((id) => id.toString()) || []
      const sentRequestIds = currentUser?.sentRequests?.map((id) => id.toString()) || []
      const receivedRequestIds = currentUser?.friendRequests?.map((id) => id.toString()) || []

      if (friendIds.includes(userId)) {
        relationship = "friend"
      } else if (sentRequestIds.includes(userId)) {
        relationship = "request_sent"
      } else if (receivedRequestIds.includes(userId)) {
        relationship = "request_received"
      }
    }

    const serializedUser = {
      ...user,
      _id: user._id.toString(),
      friends: user.friends?.map((id) => id.toString()) || [],
      relationship,
    }

    const serializedPosts = posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      userId: post.userId.toString(),
      likes: post.likes?.map((id) => id.toString()) || [],
    }))

    const serializedReels = reels.map((reel) => ({
      ...reel,
      _id: reel._id.toString(),
      userId: reel.userId.toString(),
      likes: reel.likes?.map((id) => id.toString()) || [],
    }))

    return NextResponse.json({
      success: true,
      user: serializedUser,
      posts: serializedPosts,
      reels: serializedReels,
    })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
