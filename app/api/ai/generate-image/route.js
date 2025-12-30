import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  let newPayload = {};

  try {
    // 1. Body parse karein
    const body = await req.json();
    const { topic, character_Image, uniformImage } = body;

    // Validation
    if (!topic || !character_Image) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "topic and character (image) are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let finalCharacterUrl = character_Image;
    let finalUniformUrl = uniformImage;

    // 2. Upload character image to Cloudinary
    if (character_Image) {
      console.log("Uploading character image to Cloudinary...");

      const uploadResult = await cloudinary.uploader.upload(character_Image, {
        folder: "ai_agent_characters",
        resource_type: "image",
      });

      finalCharacterUrl = uploadResult.secure_url;

      console.log("Character uploaded successfully. URL:", finalCharacterUrl);
    }

    // Upload uniform image to Cloudinary
    if (uniformImage) {
      console.log("Uploading uniform image to Cloudinary...");

      const uploadResult = await cloudinary.uploader.upload(uniformImage, {
        folder: "ai_agent_characters",
        resource_type: "image",
      });

      finalUniformUrl = uploadResult.secure_url;

      console.log("Uniform uploaded successfully. URL:", finalUniformUrl);
    }

    // 3. Payload for n8n
    newPayload = {
      topic,
      character_Image: finalCharacterUrl,
      uniformImage: finalUniformUrl,
    };

    // 4. Send to webhook
    const response = await fetch(
      "https://n8n.limbutech.in/webhook/ef9049a4-dd5a-49ac-91a4-cd732379460e",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayload),
      }
    );

    console.log(`n8n Webhook Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();

    if (!response.ok) {
      console.error("Webhook error response:", responseText);
      throw new Error(`Webhook failed with status ${response.status} ${response.statusText}`);
    }

    if (!responseText) {
      throw new Error(`Webhook returned empty response (Status: ${response.status})`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Webhook response parsing failed. Raw response:", responseText);
      throw new Error("Invalid JSON response from AI service");
    }

    // 5. Return response
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in aiAgent API:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
