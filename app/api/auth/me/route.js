import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()

    console.log("[v0] /api/auth/me - Session:", session ? `userId: ${session.userId}` : "No session")

    if (!session) {
      return NextResponse.json({ user: null })
    }

    let db
    try {
      db = await getDb()
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError.message)
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 503 },
      )
    }

    if (!ObjectId.isValid(session.userId)) {
      console.error("[v0] Invalid userId format:", session.userId)
      return NextResponse.json({ user: null })
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { password: 0 } })

    if (!user) {
      console.error("[v0] User not found for session userId:", session.userId)
      return NextResponse.json({ user: null })
    }

    console.log("[v0] User fetched successfully:", user.email)

    return NextResponse.json({
      user: { ...user, _id: user._id.toString() },
    })
  } catch (error) {
    console.error("[v0] Get me error:", error.message)
    return NextResponse.json({ user: null })
  }
}
