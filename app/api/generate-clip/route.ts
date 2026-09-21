import { NextRequest, NextResponse } from "next/server";
import { GeneratedStory } from "@/lib/types/story";
import { generateCharacterVideo } from "@/lib/wavespeed/generateCharacterVideo";
import { syncLipsync } from "@/lib/wavespeed/syncLipsync";

interface ClipRequest {
  story: GeneratedStory;
  beatNumber: number;
  /** Publicly accessible CDN URL for the Chatterbox audio of this beat (from audioUrl in audioMap). */
  audioUrl: string;
}

export async function POST(req: NextRequest) {
  let body: ClipRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { story, beatNumber, audioUrl } = body;

  if (!story || !beatNumber || !audioUrl) {
    return NextResponse.json(
      { error: "story, beatNumber, and audioUrl are required" },
      { status: 400 }
    );
  }

  // Resolve beat
  const beat = story.beats.find((b) => b.beatNumber === beatNumber);
  if (!beat) {
    return NextResponse.json({ error: `Beat ${beatNumber} not found in story` }, { status: 404 });
  }
  if (beat.beatType === "broll") {
    return NextResponse.json(
      { error: "Cannot generate a clip for a B-roll beat — select a dialogue beat" },
      { status: 400 }
    );
  }
  if (!beat.voiceRole || !beat.narration) {
    return NextResponse.json(
      { error: `Beat ${beatNumber} has no voiceRole or narration` },
      { status: 400 }
    );
  }

  // Resolve character
  const character = story.characters.find((c) => c.voiceRole === beat.voiceRole);
  if (!character) {
    return NextResponse.json(
      { error: `No character found for voiceRole "${beat.voiceRole}"` },
      { status: 404 }
    );
  }
  if (!character.referenceImageUrl) {
    return NextResponse.json(
      {
        error: `Character "${character.name}" has no reference image — generate the character sheet first, then re-synthesize audio, then generate the clip`,
        stage: "preflight",
      },
      { status: 400 }
    );
  }

  // Stage 1 — PixVerse C1 reference-to-video
  let generatedVideoUrl: string;
  try {
    generatedVideoUrl = await generateCharacterVideo(character, beat);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Video generation failed: ${msg}`, stage: "video" },
      { status: 500 }
    );
  }

  // Stage 2 — Sync Lipsync 3
  let finalVideoUrl: string;
  try {
    finalVideoUrl = await syncLipsync(generatedVideoUrl, audioUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Return the un-synced video URL so the user can still evaluate motion/identity
    return NextResponse.json(
      {
        error: `Lip sync failed: ${msg}`,
        stage: "lipsync",
        generatedVideoUrl,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    videoUrl: finalVideoUrl,
    generatedVideoUrl, // pre-sync video, useful for comparison
    character: character.name,
    beatNumber,
  });
}
