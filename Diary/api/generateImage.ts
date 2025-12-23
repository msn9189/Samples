export default async function handler(req: any, res: any) {
  // Access env var in a runtime-safe way (Edge runtimes may not expose `process`)
  const HF_KEY =
    (typeof process !== "undefined" && process?.env?.HUGGING_FACE_API_KEY) ||
    (globalThis as any)?.HUGGING_FACE_API_KEY;
  if (!HF_KEY) {
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

    // Use Hugging Face Router endpoint (api-inference.huggingface.co is deprecated)
    const hfUrl =
      "https://router.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0?wait_for_model=true";

    const response = await fetch(hfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_KEY}`,
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
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(response.status).json({
        error: "Hugging Face API error",
        status: response.status,
        details: text || undefined,
      });
    }

    const imageBuffer = await response.arrayBuffer();

    // Convert ArrayBuffer to base64 in a runtime-safe way (works in edge and node)
    function arrayBufferToBase64(buffer: ArrayBuffer) {
      try {
        // Prefer browser `btoa` if available
        if (typeof btoa === "function") {
          let binary = "";
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        }
      } catch (e) {
        // fallthrough to Buffer if available
      }

      // Node.js Buffer fallback
      try {
        // @ts-ignore Buffer may be available in Node runtimes
        return Buffer.from(new Uint8Array(buffer)).toString("base64");
      } catch (e) {
        console.error("Failed to convert image buffer to base64:", e);
        return null;
      }
    }

    const base64Image = arrayBufferToBase64(imageBuffer);
    if (!base64Image) {
      return res.status(500).json({ error: "Failed to encode image buffer" });
    }

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
