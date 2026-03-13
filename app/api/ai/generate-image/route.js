import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { topic, uniformImage, character_Image } = body

    if (!topic) {
      return NextResponse.json({ success: false, message: "topic is required" }, { status: 400 })
    }

    let finalCharacterUrl = null
    let finalUniformUrl = null

    // Upload Character Image (if provided)
    if (character_Image) {
      console.log("Uploading character image...")
      const characterUpload = await cloudinary.uploader.upload(character_Image, {
        folder: "ai_agent_characters",
        resource_type: "image",
      })
      finalCharacterUrl = characterUpload.secure_url
    }

    // Upload Uniform Image (if provided)
    if (uniformImage) {
      console.log("Uploading uniform image...")
      const uniformUpload = await cloudinary.uploader.upload(uniformImage, {
        folder: "ai_agent_uniforms",
        resource_type: "image",
      })
      finalUniformUrl = uniformUpload.secure_url
    }

    // Prepare payload for n8n
    const newPayload = {
      topic,
      character_Image: finalCharacterUrl,
      uniformImage: finalUniformUrl,
    }

    // Send to n8n webhook
    const response = await fetch(
      "https://n8n.srv1387094.hstgr.cloud/webhook/ColorKode-image-modal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayload),
      }
    )

    const data = await response.json()

    // Save generation log to DB (best-effort — don't fail the request if this errors)
    try {
      const db = await getDb()
      await db.collection("imageGenerations").insertOne({
        _id: new ObjectId(),
        userId: session?.userId ? new ObjectId(session.userId) : null,
        topic,
        characterImageUrl: finalCharacterUrl,
        uniformImageUrl: finalUniformUrl,
        coinsUsed: 20,
        status: response.ok ? "success" : "failed",
        createdAt: new Date(),
      })
    } catch (logErr) {
      console.error("[v0] Failed to log image generation:", logErr.message)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
