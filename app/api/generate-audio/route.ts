import { NextRequest, NextResponse } from "next/server";
import { GeneratedStory } from "@/lib/types/story";
import { routeBeat, BeatAudioResult } from "@/lib/voice/synthesizeBeat";

interface AudioRequestBody {
  story: GeneratedStory;
  voiceAssignments: Record<string, string>; // character name → voice registry id
}

export async function POST(req: NextRequest) {
  const hasGrok = !!process.env.XAI_API_KEY;
  const hasFal  = !!process.env.FAL_API_KEY;

  if (!hasGrok && !hasFal) {
    return NextResponse.json({ error: "No TTS provider configured (XAI_API_KEY or FAL_API_KEY required)" }, { status: 503 });
  }

  let body: AudioRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { story, voiceAssignments = {} } = body;

  if (!story || !Array.isArray(story.beats) || story.beats.length === 0) {
    return NextResponse.json({ error: "Story has no beats" }, { status: 400 });
  }

  // Separate B-roll beats (no voice) from beats that need synthesis
  const voiceBeats = story.beats.filter(
    (b) => b.beatType !== "broll" && b.narration && b.voiceRole
  );
  const skippedBeats = story.beats
    .filter((b) => b.beatType === "broll" || !b.narration || !b.voiceRole)
    .map((b) => ({ beatNumber: b.beatNumber, reason: "broll" as const }));

  const results = await Promise.allSettled(
    voiceBeats.map((beat) =>
      routeBeat(
        beat,
        beat.taggedNarration ?? beat.narration,
        voiceAssignments
      )
    )
  );

  const audio: BeatAudioResult[] = [];
  const errors: { beatNumber: number; error: string }[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      audio.push(r.value);
    } else {
      errors.push({
        beatNumber: voiceBeats[i].beatNumber,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  });

  return NextResponse.json({ audio, errors, skippedBeats });
}
