import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { ObjectId } from "mongodb"

export async function GET(request) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const skip = (page - 1) * limit

    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ]
    }

    const [users, total] = await Promise.all([
      db
        .collection("users")
        .find(query, {
          projection: {
            password: 0,
            coinHistory: 0,
            friends: 0,
            friendRequests: 0,
            sentRequests: 0,
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("users").countDocuments(query),
    ])

    const serialized = users.map((u) => ({
      ...u,
      _id: u._id.toString(),
    }))

    return NextResponse.json({
      success: true,
      users: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[admin] Get users error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}
