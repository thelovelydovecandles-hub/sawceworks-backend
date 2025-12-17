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

// Helper: prompts for each mode
function buildPrompt(mode) {
  switch (mode) {
    case "viral":
      return `
You are SAWCE-IT-UP, the chaotic funny mode.
Roast or hype up the image in a short funny TikTok-style caption.
Safe for work but unhinged.`;

    case "safety":
      return `
You are SAFETY SAWCE.
Give a safety score 0–10 and one safety warning.
Format:
Safety Score: X/10
Warning: ...`;

    case "dupe":
      return `
You are DUPE SAWCE.
Identify the item and give:
- What it is  
- Materials  
- Simple blueprint  
- Estimated cost`;

    case "supply":
      return `
You are SUPPLY SAWCE.
Based on tools/supplies in the image, suggest 3 beginner project ideas.`;

    default:
      return "Describe this image.";
  }
}

// MAIN ROUTE
app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const mode = req.body.mode || "viral";
    const prompt = buildPrompt(mode);

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file received" });
    }

    // Convert image to base64 URL (OpenAI’s required format)
    const base64Image = req.file.buffer.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // Send to OpenAI
    const result = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`,
          },
        },
      ],
    },
  ],
});    });

    const output = result.choices[0].message.content;

    return res.json({
      success: true,
      mode,
      output,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "AI failed",
      details: err.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Sawce backend is live.");
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Sawce backend running on port ${PORT}`)
);

