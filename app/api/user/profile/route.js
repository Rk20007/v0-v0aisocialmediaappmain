import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PUT(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { name, bio, location, interests, avatar, coverImage } = await request.json()

    const db = await getDb()
    const updateData = {
      updatedAt: new Date(),
      profileComplete: true,
    }

    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (location !== undefined) updateData.location = location
    if (interests !== undefined) updateData.interests = interests
    if (avatar !== undefined) updateData.avatar = avatar
    if (coverImage !== undefined) updateData.coverImage = coverImage

    await db.collection("users").updateOne({ _id: new ObjectId(session.userId) }, { $set: updateData })

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { password: 0 } })

    return NextResponse.json({
      success: true,
      user: { ...user, _id: user._id.toString() },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: { ...user, _id: user._id.toString() },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
