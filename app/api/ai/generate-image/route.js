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
    let data
    try {
      const response = await fetch(
        "https://n8n.limbutech.in/webhook/ef9049a4-dd5a-49ac-91a4-cd732379460e",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPayload),
        }
      )

      if (!response.ok) {
        console.error("[v0] n8n webhook error:", response.status, await response.text())
        return NextResponse.json(
          {
            success: false,
            error: "AI image service is temporarily unavailable. Please try again in a minute.",
          },
          { status: 503 }
        )
      }

      data = await response.json()
    } catch (networkErr) {
      console.error("[v0] n8n webhook network error:", networkErr)
      return NextResponse.json(
        {
          success: false,
          error: "Cannot reach AI image service right now (network timeout). Please check your connection or try again later.",
        },
        { status: 503 }
      )
    }

    // Save generation log to DB (best-effort — don't fail the request if this errors)
    try {
      const db = await getDb()
      await db.collection("imageGenerations").insertOne({
        _id: new ObjectId(),
        userId: session?.userId ? new ObjectId(session.userId) : null,
        topic,
        characterImageUrl: finalCharacterUrl,
        uniformImageUrl: finalUniformUrl,
        coinsUsed: 10,
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