import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = process.env.PORT || 10000;
const corsOrigin = process.env.CORS_ORIGIN || "*";
const geminiApiKey = process.env.GEMINI_API_KEY;
const systemPrompt =
  "You are an AI assistant for Abhishek Kumar's portfolio. Answer questions about skills, projects, education, experience and contact. You may handle normal greetings and small talk naturally.";
const geminiModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "portfolio-b-backend",
    hasGeminiKey: Boolean(geminiApiKey),
    commit: process.env.RENDER_GIT_COMMIT || "unknown",
    models: geminiModels
  });
});

app.post("/api/chat", async (req, res) => {
  const userMessage = String(req.body?.message || req.body?.prompt || "").trim();
  const temperature = Number(req.body?.temperature ?? 0.3);
  const maxOutputTokens = Number(req.body?.maxOutputTokens ?? 1000);

  if (!userMessage) {
    return res.status(400).json({ error: "message is required" });
  }
  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY is not configured on backend");
    return res.status(503).json({ reply: "Sorry, the AI service is temporarily unavailable." });
  }

  try {
    let finalReply = "";
    let lastError = null;

    for (const model of geminiModels) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { temperature, maxOutputTokens }
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        lastError = { model, status: response.status, data };
        continue;
      }

      finalReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (finalReply) break;
    }

    if (!finalReply) {
      if (lastError) {
        console.error("Gemini request failed on all models:", lastError);
      }
      return res.status(503).json({ reply: "Sorry, the AI service is temporarily unavailable." });
    }

    return res.json({ reply: finalReply });
  } catch (error) {
    console.error("Backend chat failed:", error);
    return res.status(503).json({ reply: "Sorry, the AI service is temporarily unavailable." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
