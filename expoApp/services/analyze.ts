import { AnalyzeInput, AnalyzeResult } from "@/types/vision";

export async function analyze(
  input: AnalyzeInput
): Promise<AnalyzeResult> {
  // ⚠️ TEMPORARY MOCK IMPLEMENTATION
  // THIS FILE IS THE ONLY FILE YOU WILL CHANGE LATER

  await new Promise((r) => setTimeout(r, 800));

  return {
    speechText:
      "There is a medicine packet in front of you. It appears to be paracetamol.",
    vibrationPattern: 3,
    metadata: {
      objects: ["medicine packet"],
      confidence: 0.82,
    },
  };
}
