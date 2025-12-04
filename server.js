import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- FIXED AI ROUTE ---- //
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are SawceWorks AI. Analyze an item and produce: a dupe version, safety rating, materials list, cut list, steps, and safety warnings."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze the image." },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${imageBase64}`
            }
          ]
        }
      ]
    });

    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      data: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`SawceWorks backend running`)
);
