import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "30")
    const search = searchParams.get("search") || ""
    const skip = (page - 1) * limit

    const matchQuery = {}
    if (search) {
      matchQuery.$or = [
        { topic: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ]
    }

    const pipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { name: 1, avatar: 1, email: 1 } }],
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: { $toString: "$_id" },
                userId: { $toString: "$userId" },
                userName: "$user.name",
                userAvatar: "$user.avatar",
                userEmail: "$user.email",
                topic: 1,
                hasCharacterImage: { $cond: [{ $ifNull: ["$characterImageUrl", false] }, true, false] },
                hasUniformImage: { $cond: [{ $ifNull: ["$uniformImageUrl", false] }, true, false] },
                coinsUsed: 1,
                status: 1,
                createdAt: 1,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]

    const result = await db.collection("imageGenerations").aggregate(pipeline).toArray()
    const images = result[0]?.data || []
    const total = result[0]?.total[0]?.count || 0

    // Total coins spent on image generation
    const coinsAgg = await db
      .collection("imageGenerations")
      .aggregate([{ $group: { _id: null, total: { $sum: "$coinsUsed" } } }])
      .toArray()
    const totalCoinsSpent = coinsAgg[0]?.total || 0

    return NextResponse.json({
      success: true,
      images,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      totalCoinsSpent,
    })
  } catch (error) {
    console.error("[admin] Images error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to fetch image logs" }, { status: 500 })
  }
}
