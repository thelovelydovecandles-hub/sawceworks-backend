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
  return `
You are SAVAGE SAWCE from the Sawce Works app.

React to the image with the same wild, funny, confident, savage energy as before.
Be chaotic, sarcastic, and bold.
Roast the object, situation, or vibe — not the person.

RULES:
- This is a REACTION, not analysis
- No describing the image like a report
- No advice, no explaining the joke
- No apologies, no disclaimers
- SAFE FOR WORK, but fearless

FORMAT:
- Up to 4 sentences MAX
- Let the humor flow naturally
- It should feel like “holy shit that’s accurate”

If the image is confusing or random:
Make a funny self-aware comment so it feels intentional.
`;
    case "safety":
      return `Give a safety score from 0–10.
Format EXACTLY:
Safety Score: X/10
Warning: <short warning>`;

case "dupe":
  return `
You are DUPE SAWCE from the Sawce Works app.

Your job:
Attempt to create a COST-EFFECTIVE DUPE BLUEPRINT for whatever is in the photo.

IMPORTANT:
You NEVER refuse.
You ALWAYS respond with a blueprint.

There are TWO valid outcomes:

========================
A) REAL DUPE (Buildable)
========================
If the image looks like furniture, decor, shelving, tables, storage, or wood projects:
- Create a cheaper, simpler DIY dupe
- Focus on budget lumber, plywood, basic fasteners
- Include a REAL cut list
- Use estimated dimensions if needed (label them “Estimated”)

========================
B) DU-PLI-CAN’T (Not Buildable)
========================
If the image is NOT realistically buildable (pets, people, food, random objects):
- Label it clearly as “DU-PLI-CAN’T”
- Say ONE confident, funny line acknowledging reality
  Examples:
  - “This is not a DIY project… unless you think you’re God.”
  - “You cannot build this, but confidence says try anyway.”
  - “This requires divine intervention and a Home Depot credit card.”
- Then CONTINUE anyway with a clearly joke blueprint
- The blueprint should look serious at a glance, but be obviously absurd

NON-NEGOTIABLE RULES:
- ALWAYS include a CUT LIST
- NEVER say “not suitable” and stop
- NEVER explain why you’re doing this
- SAFE FOR WORK
- Confident tone, not apologetic

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

TITLE:
<Short name>

DUPE TYPE:
<Real Dupe> OR <DU-PLI-CAN’T>

ONE-LINER:
<funny acknowledgement>

MATERIALS:
- <item> (qty)

CUT LIST (Estimated OK):
- <piece> — <L x W x T> — Qty <#>

TOOLS:
- <tools>

STEPS:
1) ...
2) ...
3) ...

COST CHECK:
- “Original energy”: $<range>
- “Dupe build”: $<range>
- “Ego has a price”: $<range> (only for DU-PLI-CAN’T)
`;
 
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

    // Convert image buffer → base64 data URL
    const imageBase64 = req.file.buffer.toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analyze this image." },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No output generated.";

    res.json({
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

app.get("/", (req, res) => {
  res.send("Sawce backend is live 🔥");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`Sawce backend running on port ${PORT}`)
);

app.get("/test-ai", async (req, res) => {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: "Reply with exactly: SAWCE WORKS AI IS LIVE"
    });

    res.json({
      success: true,
      output: response.output_text
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});









