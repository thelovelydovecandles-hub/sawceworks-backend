import express from "express";
import multer from "multer";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// Simple usage/event tracking (early analytics)
app.post("/event", (req, res) => {
  const { name, mode } = req.body || {};
  console.log("EVENT:", {
    name,
    mode,
    time: new Date().toISOString(),
  });
  res.json({ ok: true });
});const upload = multer({ storage: multer.memoryStorage() });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
// === SAWCE BLUEPRINT PROMPTS (paste once) ===
const SAWCE_BLUEPRINT_SYSTEM = `
You are generating a Sawce Works blueprint.

Follow Sawce Works Blueprint Rulebook v1 and the Friendly Technical standard.

Output must be visual-first, beginner-safe, and professional-grade.

Do not invent steps.
Do not combine actions.
Do not decorate.

Color meaning must survive grayscale and colorblind viewing.

Use Muted Workshop Blue ONLY for active parts or connection logic.

If any rule cannot be followed, stop and request clarification.
`.trim();

const PAGE2_PROMPT = `
Generate Page 2: Orthographic Views ONLY.

Include exactly:
- One TOP view
- One FRONT view
- One SIDE view

Rules:
- Equal scale across all views
- Medium charcoal lines for primary structure
- Thin lines for secondary details
- Thin dashed lines for hidden parts
- Measurements placed OUTSIDE geometry only
- Fractions preferred (½, ¾)
- Labels use letters (A, B, C…) with thin leader lines
- No perspective distortion

Use Muted Workshop Blue ONLY if highlighting is required for clarity.

Do NOT include:
- Assembly steps
- Safety notes
- Paragraph text
`.trim();

const PAGE5_PROMPT = (stepNum = 1) => `
Generate Page 5: Assembly Step ${stepNum}.

This page must show ONE action only.

Rules:
- Highlight ONLY the active parts in Muted Workshop Blue
- All other parts fade to secondary visual weight
- Use ONLY ONE fastener type PER ASSEMBLY STEP
- Different steps may use different fasteners
- If more than one fastener type is required, split into another step

Include:
- Tool icon
- Safety overlay using color + pattern + icon
- Visual checkpoint for alignment or completion

Text rules:
- Maximum 2 short sentences
- Plain language only
`.trim();

const PAGE6_PROMPT = `
Generate Page 6: Exploded View.

Rules:
- Vertical exploded layout ONLY
- Parts separate straight from assembled position
- No rotation unless orientation matters
- Group identical parts and label quantity once (×4)
- Labels include part letter + part name
- Muted Workshop Blue used ONLY on:
  - Connection faces
  - Fastener landing zones

Do NOT include:
- Measurements
- Safety warnings
- Assembly instructions
- Decorative color
`.trim();

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
// === BLUEPRINT GENERATOR ENDPOINT ===
// Send JSON (no image needed) and get back the blueprint page text.
app.post("/blueprint", async (req, res) => {
  try {
    const {
      page = "2",      // "2" | "5" | "6"
      stepNum = 1,     // only used if page === "5"
      buildType = "End Table",
      style = "Mid-Century Modern (general)",
      designerUpgrades = "None",
      skillLevel = "Beginner",
      dimensions = `18" x 18" x 22"`,
      materialConstraints = "",
      toolsAvailable = "",
      units = "Inches",
    } = req.body || {};

    const inputBlock = `
BUILD TYPE: ${buildType}
STYLE: ${style}
DESIGNER UPGRADES: ${designerUpgrades}
SKILL LEVEL: ${skillLevel}
OVERALL DIMENSIONS: ${dimensions}
MATERIAL CONSTRAINTS: ${materialConstraints || "[optional]"}
TOOLS AVAILABLE: ${toolsAvailable || "[optional]"}
UNITS: ${units}
`.trim();

    let pagePrompt = "";
    if (page === "2") pagePrompt = PAGE2_PROMPT;
    else if (page === "5") pagePrompt = PAGE5_PROMPT(stepNum);
    else if (page === "6") pagePrompt = PAGE6_PROMPT;
    else {
      return res.status(400).json({
        success: false,
        error: "Invalid page. Use '2', '5', or '6'.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SAWCE_BLUEPRINT_SYSTEM },
        { role: "user", content: `${inputBlock}\n\n${pagePrompt}` },
      ],
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No output generated.";

    res.json({
      success: true,
      page,
      stepNum: page === "5" ? stepNum : undefined,
      output,
    });
  } catch (err) {
    console.error("BLUEPRINT AI ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Blueprint AI failed",
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












