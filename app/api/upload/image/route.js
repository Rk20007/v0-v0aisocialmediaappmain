import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get("image")

    if (!image) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 })
    }

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("file", image)
    cloudinaryFormData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "colorcode_preset")

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/image/upload`

    const uploadRes = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    })

    const uploadData = await uploadRes.json()

    if (!uploadRes.ok) {
      throw new Error(uploadData.error?.message || "Image upload failed")
    }

    return NextResponse.json({
      success: true,
      url: uploadData.secure_url,
      publicId: uploadData.public_id,
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
