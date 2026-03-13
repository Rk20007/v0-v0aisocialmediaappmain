import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(request) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const skip = (page - 1) * limit

    const matchQuery = {}
    if (search) {
      matchQuery.$or = [
        { content: { $regex: search, $options: "i" } },
        { caption: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
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
                pipeline: [{ $project: { name: 1, avatar: 1 } }],
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: { $toString: "$_id" },
                userId: { $toString: "$userId" },
                userName: "$user.name",
                // Only include Cloudinary/http URLs — skip base64 data URIs to avoid 16MB BSON limit
                hasImage: { $cond: [{ $ifNull: ["$imageUrl", false] }, true, false] },
                imageUrl: {
                  $cond: [
                    { $regexMatch: { input: { $ifNull: ["$imageUrl", ""] }, regex: "^https?://" } },
                    "$imageUrl",
                    null,
                  ],
                },
                content: 1,
                caption: 1,
                topic: 1,
                likesCount: { $size: { $ifNull: ["$likes", []] } },
                commentsCount: { $size: { $ifNull: ["$comments", []] } },
                createdAt: 1,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]

    const result = await db.collection("posts").aggregate(pipeline).toArray()
    const posts = result[0]?.data || []
    const total = result[0]?.total[0]?.count || 0

    return NextResponse.json({
      success: true,
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[admin] Get posts error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 })
  }
}
