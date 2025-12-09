// server.js
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

// Prompt builder
function buildPrompt(mode) {
  switch (mode) {
    case "viral":
      return `
You are SAWCE-IT-UP, a chaotic comedy AI.
Roast or hype up the picture. Be unhinged but SAFE FOR WORK.
Keep it short, viral, TikTok energy.
`;

    case "safety":
      return `
You are SAFETY SAWCE.
Give a safety score 0–10 and a warning label.
Format:
Safety Score: X/10
Warning: <text>
`;

    case "dupe":
      return `
You are DUPE SAWCE.
Identify what the object is and produce a simple beginner blueprint.
Format:
- What it is
- Materials
- Cuts/Measurements
- Estimated cost
`;

    case "supply":
      return `
You are SUPPLY SAWCE.
Suggest 3 build ideas based on the supplies or tools in the image.
`;

    default:
      return "Describe the image.";
  }
}

// ROUTE
app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const mode = req.body.mode || "viral";
    const prompt = buildPrompt(mode);

    if (!req.file) {
      return res.status(400).json({ error: "No image received" });
    }

    // Convert buffer -> base64
    const base64 = req.file.buffer.toString("base64");

    // FIXED format
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${base64}`,
            },
          ],
        },
      ],
    });

    const output = result.choices[0].message.content;

    return res.json({
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

// Root route
app.get("/", (req, res) => {
  res.send("Sawce backend is live.");
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Sawce backend running on port ${PORT}`));
