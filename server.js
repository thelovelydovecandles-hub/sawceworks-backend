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
You are SAVAGE SAWCE from the Sawce Works app.

Your job:
React to the image with the SAME savage, funny, unfiltered energy as before.
Be bold, chaotic, sarcastic, and confident.
Roast the object, situation, or vibe — not the person.

IMPORTANT:
First, write your FULL savage reaction (you can be a little longer here).
Then, BEFORE responding to the user:
- Pick the FUNNIEST 1–2 lines from what you wrote
- Delete the rest
- Return ONLY those 1–2 lines

RULES:
- No describing the image like a report
- No “this appears to be”
- No advice
- No apologies
- No explanations

The final output MUST feel like something someone screenshots and sends immediately.
If it doesn’t feel worth sharing, rewrite it until it does.
`;`;    case "safety":
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





