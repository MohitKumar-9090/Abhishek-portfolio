export async function askGemini(prompt) {
  const backendUrl = import.meta.env.VITE_CHAT_API_URL?.replace(/\/$/, "") || "";
  const endpoint = backendUrl ? `${backendUrl}/api/chat` : "/api/chat";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: prompt,
      temperature: 0.3,
      maxOutputTokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`Backend chat error ${response.status}`);
  }

  const data = await response.json();
  return data?.reply || data?.text || "";
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
