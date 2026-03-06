const hinglishTokens = [
  "kya",
  "kaise",
  "kyu",
  "kyun",
  "kese",
  "kaun",
  "kab",
  "kaha",
  "btao",
  "batao",
  "bare",
  "mein",
  "me",
  "kr",
  "kar",
  "rha",
  "raha",
  "rhe",
  "rahe",
  "hai",
  "ho",
  "nahi",
  "nhi"
];

const bhojpuriTokens = [
  "ka haal ba",
  "ka haal",
  "ka kari",
  "ka karat",
  "ka karat ba",
  "ham",
  "rauri",
  "tohar",
  "ba",
  "bani",
  "bada",
  "kaini",
  "kaise bani",
  "batayi",
  "puchat",
  "hamni"
];

export function tokenizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\u0900-\u097f\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hasPhraseOrWord(rawText, words, value) {
  if (value.includes(" ")) return rawText.includes(value);
  return words.includes(value);
}

export function detectLanguageTone(text) {
  const raw = text.toLowerCase().trim();
  const words = tokenizeWords(raw);

  const bhojpuriScore = bhojpuriTokens.reduce((count, token) => count + (hasPhraseOrWord(raw, words, token) ? 1 : 0), 0);
  if (bhojpuriScore >= 2) return "bhojpuri";

  if (/[\u0900-\u097F]/.test(raw)) return "hindi";

  const hinglishScore = hinglishTokens.reduce((count, token) => count + (words.includes(token) ? 1 : 0), 0);
  const englishMarkers = ["what", "how", "skills", "projects", "experience", "education", "contact", "please"];
  const englishScore = englishMarkers.reduce((count, token) => count + (words.includes(token) ? 1 : 0), 0);

  if (hinglishScore >= 2 || (hinglishScore >= 1 && englishScore === 0)) return "hindi";
  return "english";
}

export function detectIntent(message) {
  const raw = message.toLowerCase();
  const words = tokenizeWords(raw);
  const has = (value) => hasPhraseOrWord(raw, words, value);

  if (["phone", "mobile", "number", "contact number", "phone number"].some(has)) return "phone";
  if (["email", "mail", "email id"].some(has)) return "email";
  if (["github", "git hub", "repo", "repositories"].some(has)) return "github";
  if (["linkedin", "linked in"].some(has)) return "linkedin";
  if (["contact", "reach", "connect"].some(has)) return "contact";
  if (["project", "projects", "portfolio", "built", "build"].some(has)) return "projects";
  if (["skills", "skill", "tech", "technology", "stack"].some(has)) return "skills";
  if (["experience", "intern", "work"].some(has)) return "experience";
  if (["education", "college", "school", "study"].some(has)) return "education";
  if (["achievement", "achievements", "hackerrank"].some(has)) return "achievements";
  return "general";
}

function textOf(el) {
  return el?.textContent?.trim() || "";
}

function parseContactData() {
  const links = Array.from(document.querySelectorAll("#contact a, #hero a"));
  const contact = {};

  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const label = textOf(link);

    if (href.startsWith("mailto:")) contact.email = href.replace("mailto:", "");
    if (href.startsWith("tel:")) contact.phone = href.replace("tel:", "");
    if (href.includes("github.com")) contact.github = label || href.replace(/^https?:\/\//, "");
    if (href.includes("linkedin.com")) contact.linkedin = label || href.replace(/^https?:\/\//, "");
  });

  return contact;
}

export function extractPortfolioDataFromDom() {
  const hero = document.querySelector("#hero");
  const sections = Array.from(document.querySelectorAll("section[id]"));

  const name = textOf(hero?.querySelector("h1"));
  const summary = textOf(hero?.querySelector("p"));
  const role = textOf(hero?.querySelector("p:nth-of-type(2)")) || textOf(document.querySelector("#about p"));

  const skills = Array.from(document.querySelectorAll("#skills article")).map((card) => {
    const title = textOf(card.querySelector("h3"));
    const rows = Array.from(card.querySelectorAll(".space-y-5 > div")).map((row) => {
      const nameEl = row.querySelector("p");
      const percentEl = row.querySelectorAll("p")[1];
      return {
        name: textOf(nameEl),
        percent: textOf(percentEl)
      };
    });
    return { category: title, items: rows.filter((item) => item.name) };
  });

  const projects = Array.from(document.querySelectorAll("#projects article")).map((card) => ({
    title: textOf(card.querySelector("h3")),
    description: textOf(card.querySelector("p")),
    tech: Array.from(card.querySelectorAll("span")).map((el) => textOf(el)).filter(Boolean)
  }));

  const education = Array.from(document.querySelectorAll("#education article")).map((card) => ({
    degree: textOf(card.querySelector("h3")),
    details: Array.from(card.querySelectorAll("p")).map((el) => textOf(el)).filter(Boolean)
  }));

  const experience = Array.from(document.querySelectorAll("#experience article")).map((card) => ({
    heading: textOf(card.querySelector("h3")),
    lines: Array.from(card.querySelectorAll("p, li")).map((el) => textOf(el)).filter(Boolean)
  }));

  const achievements = Array.from(document.querySelectorAll("#experience article li")).map((el) => textOf(el)).filter(Boolean);
  const contact = parseContactData();
  const sectionsSnapshot = sections.slice(0, 12).map((node) => ({
    id: node.id,
    title: textOf(node.querySelector("h1, h2, h3")),
    snippet: textOf(node.querySelector("p")).slice(0, 180)
  }));

  return {
    name,
    role,
    summary,
    skills,
    projects,
    education,
    experience,
    achievements,
    contact,
    sections: sectionsSnapshot
  };
}

function getFriendlyUnrelatedReply(language) {
  if (language === "hindi") {
    return "Main Abhishek Kumar ke portfolio ka AI assistant hoon. Aap unke projects, skills, experience ya contact ke baare me puch sakte hain.";
  }
  if (language === "bhojpuri") {
    return "Ham Abhishek Kumar ke portfolio ke AI sahayak bani. Rauri unkar project, skill, experience ya contact ke baare me puch sakat bani.";
  }
  return "I am Abhishek Kumar's portfolio AI assistant. You can ask about his projects, skills, experience, education, or contact.";
}

function pickFirst(list, fallback = "Not available") {
  return list?.find(Boolean) || fallback;
}

export function buildLocalContextualFallback(userMessage, language, intent, data) {
  const contact = data.contact || {};

  if (intent === "phone" && contact.phone) return contact.phone;
  if (intent === "email" && contact.email) return contact.email;
  if (intent === "github" && contact.github) return contact.github;
  if (intent === "linkedin" && contact.linkedin) return contact.linkedin;

  if (intent === "skills") {
    const skillNames = (data.skills || []).flatMap((group) => (group.items || []).map((item) => item.name)).filter(Boolean);
    if (skillNames.length) return `${data.name || "Abhishek"} ke main skills hain: ${skillNames.slice(0, 10).join(", ")}.`;
  }

  if (intent === "projects") {
    const projectNames = (data.projects || []).map((project) => project.title).filter(Boolean);
    if (projectNames.length) return `Projects: ${projectNames.join(", ")}.`;
  }

  if (intent === "education") {
    const eduLine = pickFirst((data.education || []).map((item) => `${item.degree} ${pickFirst(item.details, "")}`.trim()));
    return language === "english" ? `Education: ${eduLine}` : `Education: ${eduLine}`;
  }

  if (intent === "experience") {
    const expLine = pickFirst((data.experience || []).map((item) => item.heading));
    return language === "english" ? `Experience: ${expLine}` : `Experience: ${expLine}`;
  }

  const lower = userMessage.toLowerCase();
  const smallTalk = ["hi", "hello", "hii", "hey", "kaise", "ka haal", "how are you"];
  if (smallTalk.some((token) => lower.includes(token))) {
    if (language === "hindi") return "Main theek hoon. Aap Abhishek ke portfolio me kya dekhna chahenge?";
    if (language === "bhojpuri") return "Ham thik bani. Rauri Abhishek ke portfolio se ka janana chahat bani?";
    return "I am doing well. What would you like to know from Abhishek's portfolio?";
  }

  return getFriendlyUnrelatedReply(language);
}

export function buildGeminiPrompt(extractedPortfolioData, recentConversation, userMessage, detectedIntent, language) {
  return `System Instruction:
You are an AI assistant for a developer portfolio website.
Answer ONLY using the provided portfolio data from the webpage.
Do not invent or assume any information.

Behavior rules:
1) Be friendly, natural, and conversational like Gemini.
2) Keep answers short and relevant.
3) If user asks for specific contact info (phone/email/github/linkedin), return only that field.
4) If the question is unrelated to portfolio, politely guide user to ask portfolio-related questions.
5) Reply in the same language as the user:
   - Hindi -> Hindi
   - English -> English
   - Bhojpuri -> Bhojpuri

Detected language: ${language}
Detected intent: ${detectedIntent}

Portfolio data extracted from webpage DOM:
${JSON.stringify(extractedPortfolioData, null, 2)}

Conversation memory:
${recentConversation || "No previous conversation."}

User message:
${userMessage}`;
}
