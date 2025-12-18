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
      return `You are SAWCE-IT-UP. Roast or hype whatever is in the image.
Keep it funny, short, viral, and SAFE FOR WORK.`;

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

    const base64Image = req.file.buffer.toString("base64");

    const result = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_image",
              image_base64: base64Image,
            },
          ],
        },
      ],
    });

    let output = "No output returned";

try {
  const message = result.output[0].content.find(
    (c) => c.type === "output_text"
  );
  if (message?.text) {
    output = message.text;
  }
} catch (e) {
  console.error("Failed to extract AI output", e);
}
    res.json({
      success: true,
      mode,
      output,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
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

