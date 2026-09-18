import { NextRequest, NextResponse } from "next/server";
import { generateSfx } from "@/lib/audio/elevenLabsSfx";

interface SfxRequestBody {
  beats: Array<{
    beatNumber: number;
    soundDesign: string;
    durationSec: number;
  }>;
}

export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 503 });
  }

  let body: SfxRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.beats) || body.beats.length === 0) {
    return NextResponse.json({ error: "No beats provided" }, { status: 400 });
  }

  // Generate SFX for each beat in parallel
  const results = await Promise.allSettled(
    body.beats.map((beat) =>
      generateSfx(beat.soundDesign, beat.durationSec, 0.3).then((sfx) => ({
        beatNumber: beat.beatNumber,
        ...sfx,
      }))
    )
  );

  const sfx: Array<{ beatNumber: number; audioBase64: string; audioMime: string }> = [];
  const errors: Array<{ beatNumber: number; error: string }> = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      sfx.push(r.value);
    } else {
      errors.push({
        beatNumber: body.beats[i].beatNumber,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  });

  return NextResponse.json({ sfx, errors });
}
