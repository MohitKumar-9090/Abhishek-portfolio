import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = process.env.PORT || 10000;
const corsOrigin = process.env.CORS_ORIGIN || "*";
const geminiApiKey = process.env.GEMINI_API_KEY;

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "portfolio-b-backend" });
});

app.post("/api/chat", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  const temperature = Number(req.body?.temperature ?? 0.3);
  const maxOutputTokens = Number(req.body?.maxOutputTokens ?? 1000);

  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }
  if (!geminiApiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on backend" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Gemini request failed",
        details: data
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.json({ text });
  } catch (error) {
    return res.status(500).json({
      error: "Backend chat failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
