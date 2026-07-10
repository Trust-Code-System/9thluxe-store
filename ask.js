// ask.js  (root)
import "dotenv/config";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing in your .env");
  process.exit(1);
}

const userPrompt = process.argv.slice(2).join(" ") || "Say hello";
const systemPrompt = "You are a helpful coding assistant, reply concisely.";

const body = {
  model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]
};

const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify(body)
});

const json = await res.json();
console.log(json?.choices?.[0]?.message?.content?.trim() ?? JSON.stringify(json, null, 2));
