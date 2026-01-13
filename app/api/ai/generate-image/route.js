import { v2 as cloudinary } from "cloudinary";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { topic, uniformImage, character_Image } = body;

    // Only topic is mandatory now
    if (!topic) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "topic is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let finalCharacterUrl = null;
    let finalUniformUrl = null;

    // Upload Character Image (if provided)
    if (character_Image) {
      console.log("Uploading character image...");
      const characterUpload = await cloudinary.uploader.upload(character_Image, {
        folder: "ai_agent_characters",
        resource_type: "image",
      });
      finalCharacterUrl = characterUpload.secure_url;
    }

    // Upload Uniform Image (if provided)
    if (uniformImage) {
      console.log("Uploading uniform image...");
      const uniformUpload = await cloudinary.uploader.upload(uniformImage, {
        folder: "ai_agent_uniforms",
        resource_type: "image",
      });
      finalUniformUrl = uniformUpload.secure_url;
    }

    // Prepare payload for n8n
    const newPayload = {
      topic,
      character_Image: finalCharacterUrl,
      uniformImage: finalUniformUrl,
    };

    // Send to n8n webhook
    const response = await fetch(
      "https://n8n.limbutech.in/webhook/ef9049a4-dd5a-49ac-91a4-cd732379460e",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayload),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("API Error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
