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

// Helper: create prompts per mode
function buildPrompt(mode) {
  switch (mode) {
    case "viral":
      return `
You are SAWCE-IT-UP, a chaotic comedy AI. 
Your job: roast or hype up whatever is in the picture.
Be absolutely unhinged but SAFE FOR WORK. 
Example vibes: "Bro this chair has BEEN through it" or "That dog looks like he pays child support."
Keep it short, funny, viral, and TikTok caption energy.
`;

    case "safety":
      return `
You are SAFETY SAWCE.  
Give a safety score from 0–10 based ONLY on the object in the photo.  
Include a short warning label or safety suggestion.
Format EXACTLY like:

Safety Score: X/10  
Warning: <your warning here>
`;

    case "dupe":
      return `
You are DUPE SAWCE.
Identify what the object is and give a simple blueprint-style breakdown.
Format:
- What it is  
- Materials needed  
- Cuts or measurements  
- Estimated cost
Make it simple enough for a beginner builder.
`;

    case "supply":
      return `
You are SUPPLY SAWCE.
Given the image (which might be tools or supplies), suggest 3 project ideas the user could build.
Keep it simple, helpful, beginner-friendly.
`;

    default:
      return "Describe the image in one sentence.";
  }
}

// ROUTE: analyze image
app.post("/analyze", upload.single("photo"), async (req, res) => {
  try {
    const mode = req.body.mode || "viral";
    const prompt = buildPrompt(mode);

    if (!req.file) {
      return res.status(400).json({ error: "No image received" });
    }

    // Send request to OpenAI
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
              type: "input_image",
              image: req.file.buffer.toString("base64"),
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
    return res.status(500).json({
      success: false,
      error: "AI failed",
      details: err.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Sawce backend running on port ${PORT}`));
