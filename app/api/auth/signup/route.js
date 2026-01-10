import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { hashPassword, setSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    const { email, mobile, password, name } = await request.json()

    if (!password || (!email && !mobile)) {
      return NextResponse.json({ success: false, error: "Email or mobile and password required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")

    try {
      await users.createIndex({ email: 1 }, { unique: true, sparse: true })
      await users.createIndex({ mobile: 1 }, { unique: true, sparse: true })
    } catch (indexError) {
      // Index might already exist, continue
      console.log("[v0] Index creation info:", indexError.message)
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      const emailExists = await users.findOne({
        email: normalizedEmail,
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already registered. Please login instead." },
          { status: 409 },
        )
      }
    }

    if (mobile) {
      const normalizedMobile = mobile.trim()
      const mobileExists = await users.findOne({ mobile: normalizedMobile })

      if (mobileExists) {
        return NextResponse.json(
          { success: false, error: "Mobile already registered. Please login instead." },
          { status: 409 },
        )
      }
    }

    const hashedPassword = await hashPassword(password)

    const newUser = {
      _id: new ObjectId(),
      email: email ? email.toLowerCase().trim() : "",
      mobile: mobile ? mobile.trim() : "",
      password: hashedPassword,
      name: name.trim(),
      bio: "",
      location: "",
      interests: [],
      avatar: "",
      coverImage: "",
      friends: [],
      friendRequests: [],
      sentRequests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      profileComplete: false,
      lastLogin: new Date(),
    }

    const result = await users.insertOne(newUser)
    console.log(`[v0] New user created with ID: ${result.insertedId}`)

    await setSession(result.insertedId.toString(), email || mobile)

    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, _id: result.insertedId.toString() },
      message: "Account created successfully",
    })
  } catch (error) {
    console.error("[v0] Signup error:", error.message)

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json({ success: false, error: `This ${field} is already registered` }, { status: 409 })
    }

    return NextResponse.json({ success: false, error: "Failed to create account. Please try again." }, { status: 500 })
  }
}
