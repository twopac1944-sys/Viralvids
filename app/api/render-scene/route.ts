import { NextRequest, NextResponse } from "next/server";
import { buildH3Prompt, type SceneJob, type CharacterReference } from "@/lib/types";
import { submitTask } from "@/lib/wavespeed/client";

// POST /api/render-scene
// Body: { scene: SceneJob, characters: CharacterReference[] }
// Submits the scene to WaveSpeed H3 and returns taskId immediately.
// Client polls /api/poll-scene to track progress.

export async function POST(req: NextRequest) {
  try {
    const { scene, characters, brandEmbed }: { scene: SceneJob; characters: CharacterReference[]; brandEmbed?: { brandName: string; logoImageUrl?: string } } = await req.json();

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

    const referenceAudio = scene.useVoiceReference
      ? involvedChars.flatMap((c) => c.voiceReferenceUrl ? [c.voiceReferenceUrl] : [])
      : [];

    const prompt = buildH3Prompt(scene, characters, brandEmbed);

    const taskId = await submitTask("minimax/h3/reference-to-video", {
      prompt,
      reference_images: referenceImages,
      reference_audio: referenceAudio,
      resolution: scene.resolutionTier ?? "768p",
      duration_seconds: scene.durationSeconds ?? 8
    });

    return NextResponse.json({
      sceneId: scene.sceneId,
      taskId,
      status: "rendering",
      usedVoiceReference: scene.useVoiceReference ?? false
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Scene render failed" }, { status: 500 });
  }
}
