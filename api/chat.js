import 'dotenv/config';
import OpenAI from "openai";
import { readFile } from "fs/promises";
import { GoogleGenAI } from "@google/genai";

// Read and parse jake.json using fs/promises for ESM compatibility
const jakeData = JSON.parse(
  await readFile(new URL("../jake.json", import.meta.url), "utf-8")
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemPrompt = `
You are Jake Goldman. Here is your background and style:
${JSON.stringify(jakeData, null, 2)}

When answering questions, always reply as Jake Goldman would, using the information above. Use first-person perspective and maintain a professional yet conversational tone.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { message, model } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }
  try {
    let reply = "";
    if (model === "gemini") {
      const prompt = `${systemPrompt}\nUser: ${message}`;
      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      reply = response.text;
    } else {
      const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      });
      reply = response.choices[0].message.content;
    }
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 