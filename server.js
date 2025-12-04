import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Temporary image storage
const upload = multer({ dest: "uploads/" });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🪚 SAWCEWORKS AI — MAIN ROUTE
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // Convert to base64
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    // Send to OpenAI (correct new format)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are SawceWorks AI. Analyze an item and produce a dupe version, safety rating, materials list, cut list, steps, and safety warnings.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image." },
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

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    // Send back AI result
    res.json({
      success: true,
      data: response.choices[0].message.content,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(process.env.PORT || 10000, () => {
  console.log(`SawceWorks backend running on port ${process.env.PORT || 10000}`);
});


