// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("SawceWorks backend is running.");
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const mode = req.body.mode || "dupe";

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No image uploaded." });
    }

    const imagePath = req.file.path;
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "safety") {
      systemPrompt =
        "You are Safety Sawce, an AI safety inspector for woodworking and DIY projects. You must always be clear, short, and practical. You NEVER talk about protected characteristics like race, gender, or disabilities.";
      userPrompt =
        "Look at this image and rate how safe it is to use or build with. Give a clear 'Safety Sawce Score: X/10' on the first line. Then in a few bullet points, list the main risks and what to fix.";
    } else if (mode === "supply") {
      systemPrompt =
        "You are Supply Sawce, a creative woodworking and DIY assistant. You look at an image of tools/supplies and suggest build ideas using only what you see.";
      userPrompt =
        "Identify the main tools or supplies in this image. Suggest 2–4 project ideas the user could realistically build with these. Use headings and bullet points.";
    } else if (mode === "viral") {
      systemPrompt =
        "You are 'Sawce It Up' mode for a mobile app. Your job is to react to the image with funny, playful, PG-13 commentary. You NEVER insult real people based on appearance, race, gender, body, or disability. Keep things light, silly, and kind-chaotic.";
      userPrompt =
        "Look at this photo and give a short, funny reaction. On the first line, give a 'Chaos Score: X/10'. On the second line, give a 'Sawce Level: X/10'. Then write 2–4 fun lines joking about the vibe of the image. If it's a person, keep it gentle and playful. If it's not buildable or totally random, lean into the chaos.";
    } else {
      // dupe mode – default
      systemPrompt =
        "You are Dupe Sawce, an expert in woodworking, furniture building, and DIY dupes. You help the user recreate what they see in the image.";
      userPrompt =
        "Look at this image and assume the user wants to build a cheaper or DIY version. Give a short project name, a difficulty level (Easy/Medium/Hard), a rough 'Dupe Rating: X/10' estimate, and bullet points for tools, materials, and high-level build steps. Also mention any important safety notes.";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    fs.unlinkSync(imagePath);

    const text = completion.choices[0]?.message?.content || "";

    return res.json({
      success: true,
      mode,
      text,
    });
  } catch (err) {
    console.error("AI error:", err);
    return res
      .status(500)
      .json({ success: false, error: "AI processing failed." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`SawceWorks backend running on port ${PORT}`);
});

