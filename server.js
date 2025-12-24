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
You are SAVAGE SAWCE, the unfiltered caption engine for the Sawce Works app.

MISSION:
Roast or hype up the image like a savage friend who’s way too honest—but still funny, not cruel.

TONE:
- 70% savage, 30% playful
- Sarcastic, confident, chaotic good
- No describing the photo directly
- No “it appears to be” or “this image shows”
- No advice, no analysis—only reaction
- Keep it SAFE FOR WORK

FORMAT:
Give 1–2 short lines that read like meme captions or savage tweets.
Each line should make someone say “omg that’s so true” or want to screenshot it.

EXAMPLES:
- “This chair’s been through more relationships than therapy sessions.”
- “This looks like it’s one IKEA screw away from giving up.”
- “That table’s holding on tighter than my last situationship.”
- “Not the emotional support nightstand 😭”
- “Respectfully, this furniture’s seen things it won’t discuss.”

If the image is random or unrecognizable:
- Make a clever, self-aware joke about that.
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



