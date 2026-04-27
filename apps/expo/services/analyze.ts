import { describeWithAI } from "@/services/visionService";
import { AnalyzeInput, AnalyzeResult } from "@/types/vision";

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {

  
  try {
    const speechText = await describeWithAI({
      base64Image: input.base64Image,
      prompt: input.prompt,
      language: input.language ?? "en",
    });

    return { speechText };
  }  catch (error: unknown) {
    if(error instanceof Error){
     return { speechText: `Error during analysis: ${error.message}` };
    } else {
      return { speechText: "Unknown error during analysis." };
    }
  }
}
