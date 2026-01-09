import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyPassword, setSession } from "@/lib/auth"

export async function POST(request) {
  try {
    const { email, mobile, password } = await request.json()

    if (!password || (!email && !mobile)) {
      return NextResponse.json({ success: false, error: "Email/mobile and password are required" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")

    const query = {}
    if (email) {
      query.email = email.toLowerCase().trim()
    } else if (mobile) {
      query.mobile = mobile.trim()
    }

    console.log(`[v0] Login attempt with query:`, query)

    const user = await users.findOne(query)

    if (!user) {
      console.log(`[v0] User not found with query:`, query)
      return NextResponse.json({ success: false, error: "Invalid email/mobile or password" }, { status: 401 })
    }

    console.log(`[v0] User found: ${user._id}, verifying password`)

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      console.log(`[v0] Invalid password for user: ${user._id}`)
      return NextResponse.json({ success: false, error: "Invalid email/mobile or password" }, { status: 401 })
    }

    console.log(`[v0] Password verified for user: ${user._id}`)

    await users.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } })

    const sessionIdentifier = user.email || user.mobile
    await setSession(user._id.toString(), sessionIdentifier)

    console.log(`[v0] Session created for user: ${user._id}`)

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, _id: user._id.toString() },
      message: "Login successful",
    })
  } catch (error) {
    console.error("[v0] Login error:", error.message)
    return NextResponse.json({ success: false, error: "Failed to login. Please try again." }, { status: 500 })
  }
}
