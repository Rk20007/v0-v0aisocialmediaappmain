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

    const user = await users.findOne({
      $or: [{ email: email?.toLowerCase() }, { mobile }].filter(Boolean),
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    await setSession(user._id.toString(), user.email || user.mobile)

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, _id: user._id.toString() },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
