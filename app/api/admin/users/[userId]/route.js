import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { ObjectId } from "mongodb"

// PUT — edit user (name, email, mobile, coins, ban, isAdmin)
export async function PUT(request, { params }) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { userId } = await params
    const body = await request.json()
    const { name, email, mobile, coins, banned, isAdmin, starterAiBonusSlots, freeImagesUsed } = body

    const updateFields = { updatedAt: new Date() }
    if (name !== undefined) updateFields.name = name.trim()
    if (email !== undefined) updateFields.email = email.toLowerCase().trim()
    if (mobile !== undefined) updateFields.mobile = mobile.trim()
    if (coins !== undefined) updateFields.coins = parseInt(coins)
    if (banned !== undefined) updateFields.banned = Boolean(banned)
    if (isAdmin !== undefined) updateFields.isAdmin = Boolean(isAdmin)
    if (starterAiBonusSlots !== undefined) {
      const n = parseInt(starterAiBonusSlots, 10)
      if (Number.isFinite(n) && n >= 0 && n <= 100) updateFields.starterAiBonusSlots = n
    }
    if (freeImagesUsed !== undefined) {
      const n = parseInt(freeImagesUsed, 10)
      if (Number.isFinite(n) && n >= 0 && n <= 500) updateFields.freeImagesUsed = n
    }

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateFields })

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const updated = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0, coinHistory: 0, friends: 0, friendRequests: 0, sentRequests: 0 } }
      )

    return NextResponse.json({
      success: true,
      user: { ...updated, _id: updated._id.toString() },
    })
  } catch (error) {
    console.error("[admin] Update user error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE — remove user and all their content
export async function DELETE(request, { params }) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { userId } = await params
    const oid = new ObjectId(userId)

    // Delete user's posts, reels, stories in parallel
    await Promise.all([
      db.collection("users").deleteOne({ _id: oid }),
      db.collection("posts").deleteMany({ userId: oid }),
      db.collection("reels").deleteMany({ userId: oid }),
      db.collection("stories").deleteMany({ userId: oid }),
      db.collection("imageGenerations").deleteMany({ userId: oid }),
    ])

    return NextResponse.json({ success: true, message: "User and all content deleted" })
  } catch (error) {
    console.error("[admin] Delete user error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
