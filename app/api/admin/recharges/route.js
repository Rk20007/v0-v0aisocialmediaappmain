import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "30")
    const type = searchParams.get("type") || "all" // all | recharge | admin_recharge
    const skip = (page - 1) * limit

    const matchType =
      type === "all"
        ? { $in: ["recharge", "admin_recharge"] }
        : type

    const pipeline = [
      { $unwind: "$coinHistory" },
      {
        $match: {
          "coinHistory.type": matchType === "all" ? { $in: ["recharge", "admin_recharge"] } : matchType,
        },
      },
      { $sort: { "coinHistory.date": -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                userId: { $toString: "$_id" },
                userName: "$name",
                userAvatar: "$avatar",
                userEmail: "$email",
                userMobile: "$mobile",
                type: "$coinHistory.type",
                coins: "$coinHistory.coins",
                amount: "$coinHistory.amount",
                paymentId: "$coinHistory.paymentId",
                orderId: "$coinHistory.orderId",
                description: "$coinHistory.description",
                date: "$coinHistory.date",
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]

    const result = await db.collection("users").aggregate(pipeline).toArray()
    const transactions = result[0]?.data || []
    const total = result[0]?.total[0]?.count || 0

    // Total revenue from Razorpay recharges
    const revenueAgg = await db
      .collection("users")
      .aggregate([
        { $unwind: "$coinHistory" },
        { $match: { "coinHistory.type": "recharge" } },
        { $group: { _id: null, total: { $sum: "$coinHistory.amount" } } },
      ])
      .toArray()
    const totalRevenue = revenueAgg[0]?.total || 0

    return NextResponse.json({
      success: true,
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalRevenue,
    })
  } catch (error) {
    console.error("[admin] Recharges error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to fetch recharges" }, { status: 500 })
  }
}
