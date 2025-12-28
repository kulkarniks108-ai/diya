
import axios from "axios";

export async function sendSOS(tokens: string[], data?: Record<string, any>) {
  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    priority: "high",
    title: "🚨 SOS Alert",
    body: "Emergency detected. Tap to view location.",
    data: data || {},
  }));

  try {
    const res = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Push response:", res.data);
  } catch (error: any) {
    console.error(
      "Failed to send push notification",
      error?.response?.data || error.message
    );
  }
}
