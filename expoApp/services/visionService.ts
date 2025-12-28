
interface GeminiDescribeInput {
  base64Image: string;
  prompt?: string;
  language?: string;
}

export async function describeWithGemini(
  input: GeminiDescribeInput
): Promise<string> {
  console.log("description called");

  return "A small wireless earphone charging case is placed in front of you on the table.";
  
// try {
//     const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
//     if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY");
  
//     const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
//     const defaultPrompt =
//       "You are assisting a blind person. Describe what is directly in front of the camera. " +
//       "Start with 'In front of you is...'. Keep it 2-3 short sentences. " +
//       "If there are obstacles or hazards visible, mention them. Respond in English.";
  
//     const prompt =
//       input.prompt && input.prompt.trim().length > 0
//         ? input.prompt
//         : defaultPrompt;
  
//     const body = {
//       contents: [
//         {
//           parts: [
//             { text: prompt },
//             {
//               inline_data: {
//                 mime_type: "image/jpeg",
//                 data: input.base64Image,
//               },
//             },
//           ],
//         },
//       ],
//     };
  
//     const res = await axios.post(endpoint, body, {
//       headers: { "Content-Type": "application/json" },
//       // Optional: you can set a short timeout to avoid hanging
//       timeout: 20000,
//     });
  
//     const candidates = (res.data && res.data.candidates) || [];
//     const first = candidates[0];
//     const parts = first?.content?.parts || [];
//     const textPart = parts.find((p: any) => typeof p?.text === "string");
//     const speechText = (textPart?.text || "").trim();
  
//     if (!speechText) {
//       console.error("Gemini response missing text:", res.data);
//       throw new Error("Empty response from Gemini");
//     }
  
//     // console.log(speechText);
  
//     return speechText;
// } catch (error: unknown) {
//   if (axios.isAxiosError(error)) {
//     console.error("Axios error in describeWithGemini:", error.message, error.response?.data);
//   } else {
//     console.error("Unexpected error in describeWithGemini:", error);
//   }
//   throw error;
  
// }
}
