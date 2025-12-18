import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()

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

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) }, { projection: { password: 0 } })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: { ...user, _id: user._id.toString() },
    })
  } catch (error) {
    console.error("[v0] Get me error:", error.message)
    return NextResponse.json({ user: null })
  }
}
