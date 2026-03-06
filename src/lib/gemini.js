import { GEMINI_API_KEY } from "../config";

export async function askGemini(prompt) {
  const backendUrl = import.meta.env.VITE_CHAT_API_URL;

  if (backendUrl) {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        temperature: 0.3,
        maxOutputTokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Backend chat error ${response.status}`);
    }

    const data = await response.json();
    return data?.text || "";
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export function parseJsonBlock(text) {
  const block = text.match(/```json\s*([\s\S]*?)```/i);
  if (block?.[1]) return JSON.parse(block[1]);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return JSON.parse(text.slice(first, last + 1));
  }
  throw new Error("Could not parse JSON response.");
}
