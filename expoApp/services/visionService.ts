
interface GeminiDescribeInput {
  base64Image: string;
  prompt?: string;
  language?: string;
}

export async function describeWithGemini(
  input: GeminiDescribeInput
): Promise<string> {
  console.log("description called");

  return "uhuhuhuhuh"

}
