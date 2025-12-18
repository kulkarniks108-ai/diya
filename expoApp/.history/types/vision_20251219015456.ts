export interface VisionResult {
  text: string;
  vibrationPattern?: number;
}

export interface AnalyzeInput {
  imageUri: string;

  // future-ready (safe to ignore for now)
  userIntent?: "general" | "medicine" | "text" | "obstacle";
  language?: string;
  detailed?: boolean;
  // optional user prompt (future: Gemini)
  prompt?: string;
}

export interface AnalyzeResult {
  speechText: string;

  vibrationPattern?: number;

  metadata?: {
    objects?: string[];
    confidence?: number;
  };
}
