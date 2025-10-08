export default async function handler(req: any, res: any) {
  if (!process.env.HUGGING_FACE_API_KEY) {
    return res.status(500).json({
      error: "Server not configured: missing HUGGING_FACE_API_KEY",
    });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { memory } = req.body;

  if (!memory || typeof memory !== "string") {
    return res.status(400).json({ error: "Memory text is required" });
  }

  try {
    // Create a prompt for image generation based on the memory
    const prompt = `A beautiful, artistic illustration representing the memory: "${memory}". The image should be warm, nostalgic, and emotionally evocative. Style: digital art, soft colors, dreamy atmosphere.`;

    // Use Hugging Face Inference API for Stable Diffusion
    // wait_for_model=true blocks until the model is ready instead of returning 503 during cold start
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0?wait_for_model=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
            width: 512,
            height: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(response.status).json({
        error: "Hugging Face API error",
        status: response.status,
        details: text || undefined,
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    res.status(200).json({
      success: true,
      image: `data:image/png;base64,${base64Image}`,
      prompt: prompt,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: "Failed to generate image",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
