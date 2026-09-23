import { NextRequest, NextResponse } from "next/server";

// POST /api/character-sheet
// Body: { characterId: string, appearance: string }
// Generates a character reference image via WaveSpeed Nano Banana 2 (text-to-image).
// Uses enable_sync_mode so no polling loop is needed — response contains the completed URL.
// Skipped by the caller for voiceOnly characters; this route does not re-check that flag.
//
// Pricing: $0.07/image at 1k resolution (Banana 2, chosen over Banana Pro at $0.14 —
// same quality ceiling for character reference sheets, half the cost).

const BANANA2_ENDPOINT = "https://api.wavespeed.ai/api/v3/google/nano-banana-2/text-to-image";

// Wraps the raw appearance description in a prompt format that steers Banana 2
// toward a clean character reference frame rather than a narrative scene.
function buildCharacterSheetPrompt(appearance: string): string {
  return (
    `Character reference portrait. ${appearance}. ` +
    `Neutral expression, looking directly at camera, plain dark background, ` +
    `sharp facial detail, photorealistic, cinematic lighting, high fidelity.`
  );
}

export async function POST(req: NextRequest) {
  let body: { characterId: string; appearance: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { characterId, appearance } = body;
  if (!characterId || !appearance) {
    return NextResponse.json(
      { error: "characterId and appearance are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "WAVESPEED_API_KEY not configured" }, { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(BANANA2_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: buildCharacterSheetPrompt(appearance),
        aspect_ratio: "3:4",
        resolution: "1k",
        output_format: "jpeg",
        enable_sync_mode: true,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: `WaveSpeed request failed: ${message}` }, { status: 502 });
  }

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `WaveSpeed Banana 2 error (${response.status}): ${errText}` },
      { status: 502 }
    );
  }

  const data = await response.json();

  // Sync mode returns the completed result directly in data.data
  const result = data?.data;
  if (!result || result.status !== "completed") {
    const errMsg = result?.error ?? data?.message ?? "Unexpected response from WaveSpeed";
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }

  const imageUrl: string | undefined = Array.isArray(result.outputs) ? result.outputs[0] : undefined;
  if (!imageUrl) {
    return NextResponse.json({ error: "WaveSpeed returned no output URL" }, { status: 502 });
  }

  return NextResponse.json({ characterId, imageUrl });
}
