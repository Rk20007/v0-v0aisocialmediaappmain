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
    const { topic, character } = body;

    // Validation
    if (!topic || !character) {
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

    let finalCharacterUrl = character;

    // 2. Upload character image to Cloudinary
    if (character) {
      console.log("Uploading character image to Cloudinary...");

      const uploadResult = await cloudinary.uploader.upload(character, {
        folder: "ai_agent_characters",
        resource_type: "image",
      });

      finalCharacterUrl = uploadResult.secure_url;

      console.log("Character uploaded successfully. URL:", finalCharacterUrl);
    }

    // 3. Payload for n8n
    newPayload = {
      topic,
      character: finalCharacterUrl,
    };

    // 4. Send to webhook
    const response = await fetch(
      "https://n8n.limbutech.in/webhook/b4431b33-9795-48f0-a4a7-7ee881b8233f",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayload),
      }
    );

    const data = await response.json();

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
