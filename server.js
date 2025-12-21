import express from "express";
import multer from "multer";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildPrompt(mode) {
  switch (mode) {
    case "viral":
  return `
You are SAVAGE SAWCE for the Sawce Works app.

Your job:
React to the image with a funny, clever, meme-ready take.

TONE:
- About 60% savage, 40% playful
- “OMG that’s so true” energy
- Roast the OBJECT or SITUATION, not the person
- Never cruel, never mean, always funny

RULES (IMPORTANT):
- MAX 2–3 short sentences
- No explanations
- No advice
- No emojis
- No hashtags
- Every response should feel screenshot-worthy

STYLE EXAMPLES (for vibe, not copying):
- “This table has main character energy and zero support.”
- “Respectfully… this is being held together by hope.”
- “Not broken. Just emotionally unstable.”

If the image is confusing or random:
Acknowledge it humorously in ONE line so it feels intentional.
`;
    case "safety":
      return `Give a safety score from 0–10.
Format EXACTLY:
Safety Score: X/10
Warning: <short warning>`;

    case "dupe":
      return `Identify the object and explain how to build a dupe.
Include materials and rough cost.`;

    case "supply":
      return `Given the supplies shown, suggest 3 beginner build ideas.`;

    default:
      return "Describe the image briefly.";
  }
}

app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const mode = req.body.mode || "viral";
    const prompt = buildPrompt(mode);

    if (!req.file) {
      return res.status(400).json({ error: "No image received" });
    }

    // Convert image buffer → base64 data URL
    const imageBase64 = req.file.buffer.toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analyze this image." },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No output generated.";

    res.json({
      success: true,
      mode,
      output,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      success: false,
      error: "AI failed",
      details: err.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Sawce backend is live 🔥");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Sawce backend running on port ${PORT}`)
);

app.get("/test-ai", async (req, res) => {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: "Reply with exactly: SAWCE WORKS AI IS LIVE"
    });

    res.json({
      success: true,
      output: response.output_text
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


