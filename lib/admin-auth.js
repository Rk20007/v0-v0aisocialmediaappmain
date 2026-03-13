import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

/**
 * Verifies the request comes from an authenticated admin user.
 * Returns { session, db } on success, or a NextResponse error on failure.
 */
export async function requireAdmin() {
  const session = await getSession()

  if (!session || !session.userId) {
    return {
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    }
  }

  const db = await getDb()
  const user = await db
    .collection("users")
    .findOne({ _id: new ObjectId(session.userId) }, { projection: { isAdmin: 1 } })

  if (!user || !user.isAdmin) {
    return {
      error: NextResponse.json({ success: false, error: "Forbidden — admin only" }, { status: 403 }),
    }
  }

  return { session, db }
}
