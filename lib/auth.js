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
  return new SignJWT({ ...payload, iat: Math.floor(Date.now() / 1000) })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    return verifyToken(token)
  } catch (error) {
    console.error("[v0] Session error:", error)
    return null
  }
}

export async function setSession(userId, email) {
  const token = await createToken({ userId, email })
  const cookieStore = await cookies()

  cookieStore.delete("auth-token")

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/", // Ensure cookie is available across all routes
  })

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
  } catch (error) {
    console.error("[v0] Clear session error:", error)
  }
}
