import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { hashPassword, setSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request) {
  try {
    const { email, mobile, password, name } = await request.json()

    // At least one required
    if (!password || (!email && !mobile)) {
      return NextResponse.json(
        { success: false, error: "Email or mobile and password required" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const users = db.collection("users")

    // -----------------------------
    // 🔥 EMAIL UNIQUE CHECK
    // -----------------------------
    if (email) {
      const emailExists = await users.findOne({
        email: email.toLowerCase(),
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already registered" },
          { status: 400 }
        )
      }
    }

    // -----------------------------
    // 🔥 MOBILE UNIQUE CHECK
    // -----------------------------
    if (mobile) {
      const mobileExists = await users.findOne({ mobile })

      if (mobileExists) {
        return NextResponse.json(
          { success: false, error: "Mobile already registered" },
          { status: 400 }
        )
      }
    }

    // -----------------------------
    // 🔥 CREATE USER
    // -----------------------------
    const hashedPassword = await hashPassword(password)

    const newUser = {
      _id: new ObjectId(),
      email: email?.toLowerCase() || "",
      mobile: mobile || "",
      password: hashedPassword,
      name: name || "",
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
    }

    await users.insertOne(newUser)

    // Session will work with email or mobile
    await setSession(newUser._id.toString(), email || mobile)

    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, _id: newUser._id.toString() },
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
