import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()
    const users = db.collection("users")

    const userId = typeof session.userId === 'string' ? new ObjectId(session.userId) : session.userId

    const user = await users.findOne(
      { _id: userId },
      { projection: { coins: 1, coinHistory: 1 } }
    )

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      coins: user.coins || 0,
      coinHistory: user.coinHistory || []
    })
  } catch (error) {
    console.error("[v0] Get wallet error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to get wallet" }, { status: 500 })
  }
}
