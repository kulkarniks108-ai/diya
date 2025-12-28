import { describeWithGemini } from "@/services/visionService";
import { AnalyzeInput, AnalyzeResult } from "@/types/vision";

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {

  // return { speechText: "Analyzing... (stub)" };
  try {
    const speechText = await describeWithGemini({
      base64Image: input.base64Image,
      prompt: input.prompt,
      language: input.language ?? "en",
    });

    return { speechText };
  } catch {
    return { speechText: "error" };
  }
}
