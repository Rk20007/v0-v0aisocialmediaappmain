import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

// POST - Mark story as viewed
export async function POST(request, { params }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const db = await getDb()

    // Add userId to views array if not already there
    await db.collection("stories").updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: { views: new ObjectId(session.userId) },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("View story error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
