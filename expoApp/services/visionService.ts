import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

interface DescribeInput {
  base64Image: string;
  prompt?: string;
  language?: string;
}

export async function describeWithAI(input: DescribeInput): Promise<string> {
  try {
    const res = await generateSpeech({
      userPrompt: input.prompt || "Describe the image for me.",
      systemPrompt:
        "You are a helpful assistant that describes images for visually impaired users keep it short and crisp and focus on what is at the center of the image.",
      base64Image: input.base64Image,
    });

    // console.log("te response is", res);
    return res.speech;
  } catch (error) {
    console.error("Error in describeWithAI:", error);
    throw error;
  }
  // return "A small wireless earphone charging case is placed in front of you on the table.";
}

export async function generateSpeech({
  userPrompt,
  systemPrompt,
  base64Image,
}: {
  userPrompt: string;
  systemPrompt: string;
  base64Image: string;
}): Promise<{ speech: string }> {
  const fakeResponse = true;
  if (fakeResponse) {
    return {
      speech:
        "fake describeWithAI you have a one plus buds infront of you. and by the way,  this is a fake response cuz we are poor",
    };
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 150,
  });

  return {
    speech: response.choices[0].message.content ?? "",
  };
}
