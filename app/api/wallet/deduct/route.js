import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

const FREE_IMAGES_LIMIT = 2

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

    // Fetch current coins and how many free images were already used
    const user = await users.findOne(
      { _id: userId },
      { projection: { coins: 1, freeImagesUsed: 1 } }
    )

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const alreadyUsed = user.freeImagesUsed || 0

    // If user still has free images left, don't deduct coins
    if (alreadyUsed < FREE_IMAGES_LIMIT) {
      const updatedUsed = alreadyUsed + 1

      const result = await users.updateOne(
        { _id: userId },
        {
          $set: { freeImagesUsed: updatedUsed },
          $push: {
            coinHistory: {
              type: "free_image",
              coins: 0,
              description: "Free image generation",
              date: new Date(),
            },
          },
        }
      )

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Failed to update free image usage" },
          { status: 500 }
        )
      }

      const freeImagesLeft = Math.max(0, FREE_IMAGES_LIMIT - updatedUsed)

      return NextResponse.json({
        success: true,
        message: "Free image used",
        coins: user.coins || 0,
        freeImagesUsed: updatedUsed,
        freeImagesLeft,
      })
    }

    // No free images left – require coins
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
    const updatedUser = await users.findOne({ _id: userId }, { projection: { coins: 1, freeImagesUsed: 1 } })

    const freeImagesLeft = Math.max(
      0,
      FREE_IMAGES_LIMIT - (updatedUser.freeImagesUsed || FREE_IMAGES_LIMIT)
    )

    return NextResponse.json({
      success: true,
      message: "Coins deducted successfully",
      coins: updatedUser.coins,
      freeImagesUsed: updatedUser.freeImagesUsed || FREE_IMAGES_LIMIT,
      freeImagesLeft,
    })
  } catch (error) {
    console.error("[v0] Deduct coins error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to deduct coins" }, { status: 500 })
  }
}
