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
}

export interface AnalyzeResult {
  speechText: string;

  vibrationPattern?: number;

  metadata?: {
    objects?: string[];
    confidence?: number;
  };
}
