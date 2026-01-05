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

GOAL:
Create a COST-EFFECTIVE duplicate (dupe) of whatever is in the photo.

You NEVER refuse. You ALWAYS output a blueprint.

DECIDE:
A) REAL DUPE (buildable: furniture/decor/shelves/tables/wood projects)
B) DU-PLI-CAN’T (not realistically buildable: pets/people/food/random)

REAL DUPE RULES:
- Make it cheaper: plywood + 1x boards + simple joinery (screws/pocket holes/brackets)
- Give a "DUPE STRATEGY" (what we swap to cut cost)
- ALWAYS include CUT LIST with quantities
- If dimensions unknown: use reasonable defaults and label “(Estimated)”
- Include cost comparison and savings

DU-PLI-CAN’T RULES:
- Label it clearly “DU-PLI-CAN’T”
- ONE funny ego line
- Then still give a joke blueprint in the same structure (absurd allowed)
- Still include a CUT LIST (absurd dimensions OK)

OUTPUT FORMAT (EXACT):

TITLE:
<name>

DUPE TYPE:
<Real Dupe> OR <DU-PLI-CAN’T>

ONE-LINER:
<funny line>

DUPE STRATEGY:
- <cheaper swap>
- <simpler build method>
- <finish trick to mimic look>

MATERIALS:
- <item> (qty)

CUT LIST (Estimated OK):
- <piece> — <L x W x T> — Qty <#>

HARDWARE:
- <screws/brackets/glue/etc>

TOOLS:
- <tools>

BUILD STEPS:
1) ...
2) ...
3) ...

COST CHECK:
- Store version (estimated): $<range>
- Dupe build (estimated): $<range>
- Savings: $<range>
- Ego has a price: $<range> (DU-PLI-CAN’T only; make it funny)
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










