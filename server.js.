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

// Where images get stored temporarily
const upload = multer({ dest: "uploads/" });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⭐ MAIN AI ROUTE — This is SawceWorks AI
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    const imageBase64 = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    // Send the photo to OpenAI with instructions
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are SawceWorks AI, the expert blueprint + dupe + safety generator. Return well-structured plans.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this item and create a full woodworking plan with: project name, dupe version, safety rating, materials, cut list, build steps & safety notes.",
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
            },
          ],
        },
      ],
    });

    const resultText = response.choices[0].message.content;

    fs.unlinkSync(imagePath); // delete image after processing

    return res.json({
      success: true,
      data: resultText,
    });
  } catch (err) {
    console.error("AI Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(process.env.PORT || 5000, () =>
  console.log(`SawceWorks backend running on port ${process.env.PORT}`)
);
