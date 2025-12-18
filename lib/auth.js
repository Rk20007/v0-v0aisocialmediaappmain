import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "colorcode-secret-key-2024")

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload) {
  return new SignJWT({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    jti: `${payload.userId}-${Date.now()}-${Math.random()}`, // unique token ID
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (!payload.userId || !payload.email) {
      console.error("[v0] Invalid token payload - missing userId or email")
      return null
    }
    return payload
  } catch (error) {
    console.error("[v0] Token verification failed:", error.message)
    return null
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) {
      console.log("[v0] No auth token found")
      return null
    }
    const session = await verifyToken(token)
    if (session) {
      console.log("[v0] Session verified for user:", session.userId)
    } else {
      console.log("[v0] Session verification failed")
    }
    return session
  } catch (error) {
    console.error("[v0] Session error:", error)
    return null
  }
}

export async function setSession(userId, email) {
  await clearSession()

  const token = await createToken({ userId, email })
  const cookieStore = await cookies()

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  console.log("[v0] New session created for user:", userId)
  return token
}

export async function clearSession() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
    cookieStore.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
    console.log("[v0] Session cleared")
  } catch (error) {
    console.error("[v0] Clear session error:", error)
  }
}
