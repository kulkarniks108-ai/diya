import { AnalyzeInput, AnalyzeResult } from "@/types/vision";
import { describeWithGemini } from "@/services/visionService";

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
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
