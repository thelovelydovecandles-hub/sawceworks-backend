
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// ✅ IMPORTANT: raise body limits for base64 images
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(mode, followUp = "") {
  if (mode === "supply") {
    return `
You are SUPPLY SAWCE from the Sawce Works app.

TASK:
Identify building supplies/materials/hardware in the image and suggest projects.

DO NOT describe the room.
DO NOT narrate the scene.
DO NOT ask questions.

FORMAT STRICTLY:
SUPPLIES DETECTED:
- ...

POSSIBLE BUILDS:
- Project (Difficulty: Easy/Medium/Hard): one sentence

RECOMMENDED NEXT SUPPLIES:
- ...

${followUp ? `USER FOLLOW-UP: ${followUp}` : ""}
`.trim();
  }

  if (mode === "safety") {
    return `
You are SAFETY SAWCE.
Give a 0–10 safety score and concrete warnings + fixes.
${followUp ? `USER FOLLOW-UP: ${followUp}` : ""}
`.trim();
  }

  if (mode === "viral") {
    return `
You are SAVAGE SAWCE.
Write 5 viral captions. Short. Funny. Confident.
${followUp ? `USER FOLLOW-UP: ${followUp}` : ""}
`.trim();
  }

  // default: dupe
  return `
You are DUPE SAWCE.
Explain what the object/build is and how to recreate it. Include materials + steps.
${followUp ? `USER FOLLOW-UP: ${followUp}` : ""}
`.trim();
}

// Health check
app.get("/", (req, res) => res.send("Sawce backend up"));

// ✅ MAIN ENDPOINT
app.post("/analyze", async (req, res) => {
  try {
    const body = req.body || {};
    const mode = body.mode || "dupe";
    const followUp = body.followUp || "";
    const previousResult = body.previousResult || "";

    // ✅ Accept multiple possible keys
    const imageRaw =
      body.imageBase64 ||
      body.image ||
      body.dataUri ||
      body.imageDataUri ||
      body.photoBase64;

    if (!imageRaw) {
      return res.status(400).json({ error: "No image received (missing base64)" });
    }

    // ✅ Convert data URI -> raw base64 if needed
    const base64 = String(imageRaw).startsWith("data:")
      ? String(imageRaw).split(",")[1]
      : String(imageRaw);

    if (!base64 || base64.length < 50) {
      return res.status(400).json({ error: "Image base64 looks empty/invalid" });
    }

    const prompt = buildPrompt(mode, followUp);

    // ✅ If you want the model to “remember” what it already said:
    const combinedText = previousResult
      ? `PREVIOUS RESULT:\n${previousResult}\n\nNEW TASK:\n${prompt}`
      : prompt;

    // ✅ Vision request (image + text)
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: combinedText },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64}`,
            },
          ],
        },
      ],
    });

    // Pull text out safely
    const resultText =
      response.output_text ||
      response.output?.[0]?.content?.map((c) => c.text).join("\n") ||
      "";

    if (!resultText) {
      return res.status(500).json({ error: "Model returned empty result" });
    }

    return res.json({ result: resultText });
  } catch (err) {
    console.error("ANALYZE ERROR:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Sawce backend running on", port));












