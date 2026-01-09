import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()

    console.log(`[v0] GET /api/auth/me - Session userId: ${session?.userId || "null"}`)

    if (!session || !session.userId) {
      console.log("[v0] No valid session found")
      return NextResponse.json({ user: null })
    }

    if (!ObjectId.isValid(session.userId)) {
      console.error(`[v0] Invalid ObjectId format: ${session.userId}`)
      return NextResponse.json({ user: null })
    }

    const db = await getDb()
    const users = db.collection("users")

    const user = await users.findOne({ _id: new ObjectId(session.userId) }, { projection: { password: 0 } })

    if (!user) {
      console.error(`[v0] User not found for session userId: ${session.userId}`)
      return NextResponse.json({ user: null })
    }

    console.log(`[v0] User fetched successfully: ${user.email || user.mobile}`)

    return NextResponse.json({
      success: true,
      user: { ...user, _id: user._id.toString() },
    })
  } catch (error) {
    console.error("[v0] GET /api/auth/me error:", error.message)
    return NextResponse.json({ user: null })
  }
}
