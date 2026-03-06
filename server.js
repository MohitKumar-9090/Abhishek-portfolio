import http from "node:http";

const port = Number(process.env.PORT || 10000);
const corsOrigin = process.env.CORS_ORIGIN || "*";
const geminiApiKey = process.env.GEMINI_API_KEY;
const systemPrompt =
  "You are an AI assistant for Abhishek Kumar's portfolio. Answer questions about skills, projects, education, experience and contact. You may handle normal greetings and small talk naturally.";

function sendJson(res, status, body, origin = "*") {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin === "*" ? "*" : origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      resolve(raw);
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin;
  const allowOrigin = corsOrigin === "*" ? "*" : requestOrigin === corsOrigin ? corsOrigin : corsOrigin;

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {}, allowOrigin);
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true, service: "portfolio-b-backend" }, allowOrigin);
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    try {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const userMessage = String(body?.message || body?.prompt || "").trim();
      const temperature = Number(body?.temperature ?? 0.3);
      const maxOutputTokens = Number(body?.maxOutputTokens ?? 1000);

      if (!userMessage) {
        sendJson(res, 400, { error: "message is required" }, allowOrigin);
        return;
      }
      if (!geminiApiKey) {
        sendJson(res, 500, { error: "GEMINI_API_KEY is not configured on backend" }, allowOrigin);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { temperature, maxOutputTokens }
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        sendJson(res, 503, { reply: "Sorry, the AI service is temporarily unavailable." }, allowOrigin);
        return;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      sendJson(res, 200, { reply: text || "Sorry, the AI service is temporarily unavailable." }, allowOrigin);
      return;
    } catch (error) {
      sendJson(res, 503, { reply: "Sorry, the AI service is temporarily unavailable." }, allowOrigin);
      return;
    }
  }

  sendJson(res, 404, { error: "Not found" }, allowOrigin);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
});
