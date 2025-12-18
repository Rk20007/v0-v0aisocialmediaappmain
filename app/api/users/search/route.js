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
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ success: true, users: [] })
    }

    const db = await getDb()

    const users = await db
      .collection("users")
      .find(
        {
          _id: { $ne: new ObjectId(session.userId) },
          $or: [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }],
        },
        { projection: { password: 0 } },
      )
      .limit(20)
      .toArray()

    const serializedUsers = users.map((u) => ({
      ...u,
      _id: u._id.toString(),
    }))

    return NextResponse.json({ success: true, users: serializedUsers })
  } catch (error) {
    console.error("Search users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
