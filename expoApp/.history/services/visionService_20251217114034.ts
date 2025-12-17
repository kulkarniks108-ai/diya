type VisionResult = {
  description: string;
};

const USE_MOCK = true; // 👈 change to false later

export async function analyzeImage(base64Image: string): Promise<VisionResult> {
  if (USE_MOCK) {
    // ✅ Mock response (what Google Vision WOULD return)
    return {
      description:
        "There is a medicine packet in front of you. It appears to be paracetamol.",
    };
  }

  // 🔥 REAL GOOGLE VISION IMPLEMENTATION (READY BUT NOT USED YET)
  const response = await fetch(
    "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: "LABEL_DETECTION" },
              { type: "TEXT_DETECTION" },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Vision API failed");
  }

  const data = await response.json();

  // extract meaningful text
  const labels =
    data.responses?.[0]?.labelAnnotations
      ?.map((l: any) => l.description)
      ?.join(", ") || "Unknown objects";

  return {
    description: `I see the following objects: ${labels}`,
  };
}