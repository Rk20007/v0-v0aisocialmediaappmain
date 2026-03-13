import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const [
      totalUsers,
      totalPosts,
      totalReels,
      totalImages,
      bannedUsers,
      adminUsers,
    ] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("posts").countDocuments(),
      db.collection("reels").countDocuments(),
      db.collection("imageGenerations").countDocuments(),
      db.collection("users").countDocuments({ banned: true }),
      db.collection("users").countDocuments({ isAdmin: true }),
    ])

    // Total coins in circulation
    const coinsAgg = await db
      .collection("users")
      .aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }])
      .toArray()
    const totalCoins = coinsAgg[0]?.total || 0

    // Total recharge revenue (sum of all recharge coinHistory entries)
    const revenueAgg = await db
      .collection("users")
      .aggregate([
        { $unwind: "$coinHistory" },
        { $match: { "coinHistory.type": "recharge" } },
        { $group: { _id: null, total: { $sum: "$coinHistory.amount" } } },
      ])
      .toArray()
    const totalRevenue = revenueAgg[0]?.total || 0

    // Recent 7 days new users
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newUsersThisWeek = await db
      .collection("users")
      .countDocuments({ createdAt: { $gte: sevenDaysAgo } })

    // Recent 5 recharge transactions
    const recentRecharges = await db
      .collection("users")
      .aggregate([
        { $unwind: "$coinHistory" },
        { $match: { "coinHistory.type": "recharge" } },
        { $sort: { "coinHistory.date": -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            userId: { $toString: "$_id" },
            userName: "$name",
            userAvatar: "$avatar",
            coins: "$coinHistory.coins",
            amount: "$coinHistory.amount",
            paymentId: "$coinHistory.paymentId",
            date: "$coinHistory.date",
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalReels,
        totalImages,
        bannedUsers,
        adminUsers,
        totalCoins,
        totalRevenue,
        newUsersThisWeek,
      },
      recentRecharges,
    })
  } catch (error) {
    console.error("[admin] Stats error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
  }
}
