import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { ObjectId } from "mongodb"

// POST — manually add coins to any user
export async function POST(request, { params }) {
  const { error, db, session } = await requireAdmin()
  if (error) return error

  try {
    const { userId } = await params
    const { coins, note } = await request.json()

    if (!coins || coins <= 0) {
      return NextResponse.json({ success: false, error: "Invalid coin amount" }, { status: 400 })
    }

    const oid = new ObjectId(userId)
    const user = await db.collection("users").findOne({ _id: oid }, { projection: { name: 1, coins: 1 } })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const result = await db.collection("users").updateOne(
      { _id: oid },
      {
        $inc: { coins: parseInt(coins) },
        $push: {
          coinHistory: {
            type: "admin_recharge",
            coins: parseInt(coins),
            amount: 0,
            description: note || "Admin manual recharge",
            adminId: session.userId,
            date: new Date(),
          },
        },
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: "Failed to update wallet" }, { status: 500 })
    }

    const updated = await db.collection("users").findOne({ _id: oid }, { projection: { coins: 1, name: 1 } })

    return NextResponse.json({
      success: true,
      message: `Added ${coins} coins to ${user.name}`,
      newBalance: updated.coins,
    })
  } catch (error) {
    console.error("[admin] Manual recharge error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to recharge" }, { status: 500 })
  }
}
