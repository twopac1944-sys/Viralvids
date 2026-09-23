import { NextRequest, NextResponse } from "next/server";
import { buildH3Prompt, type SceneJob, type CharacterReference } from "@/lib/types";

// POST /api/render-scene
// Body: { scene: SceneJob, characters: CharacterReference[] }
// Sends the scene to WaveSpeed's MiniMax H3 reference-to-video endpoint.
// useVoiceReference on the scene is the A/B toggle: with vs. without voice ref clip.

const WAVESPEED_H3_ENDPOINT = "https://api.wavespeed.ai/api/v2/minimax/h3/reference-to-video";

export async function POST(req: NextRequest) {
  try {
    const { scene, characters, brandEmbed }: { scene: SceneJob; characters: CharacterReference[]; brandEmbed?: { brandName: string; logoImageUrl?: string } } = await req.json();

    const apiKey = process.env.WAVESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "WAVESPEED_API_KEY not configured" }, { status: 500 });
    }

    const involvedIds = new Set(scene.dialogue.map((d) => d.characterId));
    const involvedChars = characters.filter((c) => involvedIds.has(c.id));

    const referenceImages = involvedChars.flatMap((c) => c.imageReferenceUrls.slice(0, 1));

    // Append logo image to reference list when the brand appears in this scene.
    if (
      brandEmbed?.logoImageUrl &&
      scene.sceneDescription.toLowerCase().includes(brandEmbed.brandName.toLowerCase())
    ) {
      referenceImages.push(brandEmbed.logoImageUrl);
    }

    const referenceAudio =
      scene.useVoiceReference && involvedChars[0]?.voiceReferenceUrl
        ? [involvedChars[0].voiceReferenceUrl]
        : [];

    const prompt = buildH3Prompt(scene, characters, brandEmbed);

    const response = await fetch(WAVESPEED_H3_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        reference_images: referenceImages,
        reference_audio: referenceAudio,
        resolution: scene.resolutionTier ?? "768p",
        duration_seconds: scene.durationSeconds ?? 8
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `WaveSpeed H3 error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();

    return NextResponse.json({
      sceneId: scene.sceneId,
      taskId: data.task_id ?? data.id,
      status: "rendering",
      usedVoiceReference: scene.useVoiceReference ?? false
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Scene render failed" }, { status: 500 });
  }
}
