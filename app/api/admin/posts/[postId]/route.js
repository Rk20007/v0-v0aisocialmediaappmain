import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { ObjectId } from "mongodb"

export async function DELETE(request, { params }) {
  const { error, db } = await requireAdmin()
  if (error) return error

  try {
    const { postId } = await params
    const result = await db.collection("posts").deleteOne({ _id: new ObjectId(postId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Post deleted" })
  } catch (error) {
    console.error("[admin] Delete post error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 })
  }
}
