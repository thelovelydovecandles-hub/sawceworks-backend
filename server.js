import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  const mode = req.body.mode || "dupe";

  if (!req.file) {
    return res.status(400).json({ success: false, error: "No image uploaded" });
  }

  const imagePath = req.file.path;

  try {
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    let systemPrompt = "";

    if (mode === "safety") {
      systemPrompt = `
You are Safety Sawce, a woodworking + general safety inspector.
You MUST return ONLY a single JSON object.

Structure:
{
  "type": "safety",
  "score": <integer 0-10>,
  "risk_level": "<low|medium|high|critical>",
  "issues": ["short bullet points of safety problems"],
  "recommendations": ["short bullet points of fixes"],
  "funny_comment": "one playful sentence"
}
If the image is not woodworking-related, still give a fun safety score and commentary without being cruel or targeting protected attributes.
      `;
    } else if (mode === "supply") {
      systemPrompt = `
You are Supply Sawce, a creative project recommender.
Return ONLY JSON in this structure:

{
  "type": "supply",
  "ideas": [
    {
      "title": "short project name",
      "difficulty": <integer 1-5>,
      "summary": "1-2 sentence explanation",
      "needed_materials": ["list of extra materials if any"]
    }
  ],
  "fun_comment": "one playful sentence"
}

Base ideas on what you can infer from the image (wood pieces, tools, etc.). 
If you can't infer much, suggest simple, universal small projects.
      `;
    } else if (mode === "viral") {
      systemPrompt = `
You are "Sawce It Up" mode for an app called Sawce Works.
Your job is to give a VIRAL, funny reaction to whatever is in the picture.
Keep it PG-13, do NOT be hateful or target protected traits.
No slurs, no real-world diagnosis, no self-harm content.

Return ONLY JSON like:

{
  "type": "viral",
  "chaos_score": <integer 0-10>,
  "sawce_level": "short label like 'Mild', 'Extra Spicy', 'Unhinged'",
  "safety_label": "funny safety summary sentence",
  "roast": "a playful roast or reaction to the image",
  "share_caption": "1-line caption someone might post with this pic"
}
      `;
    } else {
      // default dupe mode
      systemPrompt = `
You are Dupe Sawce for an app called Sawce Works.
You help people reverse-engineer furniture and builds from a photo.

Return ONLY JSON:

{
  "type": "dupe",
  "title": "short project name",
  "difficulty": <integer 1-5>,
  "est_time_hours": <integer>,
  "cut_list": [
    {
      "item": "2x4 board",
      "qty": <integer>,
      "dimensions": "length and thickness in inches or cm"
    }
  ],
  "tools": ["circular saw", "drill", "screws"],
  "safety_notes": "short paragraph of safety cautions",
  "fun_comment": "1 fun or encouraging sentence"
}

If the object is clearly not buildable, still give a playful answer and 
make a simple imaginary project inspired by the shape.
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and respond ONLY with JSON.",
            },
            {
              type: "input_image",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.9,
      max_tokens: 900,
    });

    let text = response.choices[0]?.message?.content || "";

    // defensive: strip code fences if they appear
    text = text.trim();
    if (text.startsWith("```")) {
      const parts = text.split("```");
      text = parts[1] || parts[0];
      text = text.replace(/^json/, "").trim();
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse error:", err, "raw:", text);
      return res.status(500).json({
        success: false,
        error: "Failed to parse AI JSON",
      });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("AI error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error talking to AI" });
  } finally {
    fs.unlink(imagePath, () => {});
  }
});

app.get("/", (req, res) => {
  res.send("Sawce Works backend is live.");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`SawceWorks backend running on port ${PORT}`);
});
