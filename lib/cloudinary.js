import { v2 as cloudinary } from "cloudinary"

let isConfigured = false

function configureCloudinary() {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    isConfigured = true
  }
  return cloudinary
}

export async function uploadImageFromUrl(imageUrl, folder = "colorcode") {
  const cloud = configureCloudinary()

  try {
    const result = await cloud.uploader.upload(imageUrl, {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }],
    })

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function deleteImage(publicId) {
  const cloud = configureCloudinary()

  try {
    await cloud.uploader.destroy(publicId)
    return { success: true }
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    return { success: false, error: error.message }
  }
}
