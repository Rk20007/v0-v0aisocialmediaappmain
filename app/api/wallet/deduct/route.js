import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    const session = await getSession()
    
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { coins } = await request.json()

    if (!coins || coins <= 0) {
      return NextResponse.json({ success: false, error: "Invalid coin amount" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")

    const userId = new ObjectId(session.userId)

    // First check if user has enough coins
    const user = await users.findOne({ _id: userId }, { projection: { coins: 1 } })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (user.coins < coins) {
      return NextResponse.json({ 
        success: false, 
        error: "Insufficient coins",
        currentCoins: user.coins,
        requiredCoins: coins 
      }, { status: 400 })
    }

    // Deduct coins
    const result = await users.updateOne(
      { _id: userId },
      {
        $inc: { coins: -coins },
        $push: {
          coinHistory: {
            type: "deduct",
            coins: -coins,
            description: "Image generation",
            date: new Date(),
          }
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
    }

    // Get updated coin balance
    const updatedUser = await users.findOne({ _id: userId }, { projection: { coins: 1 } })

    return NextResponse.json({
      success: true,
      message: "Coins deducted successfully",
      coins: updatedUser.coins,
    })
  } catch (error) {
    console.error("[v0] Deduct coins error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
  }
}
