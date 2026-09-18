import { NextRequest, NextResponse } from "next/server";
import { parseWAV, buildWAV, wavDurationSec } from "@/lib/audio/wavUtils";

interface ConcatBeat {
  beatNumber: number;
  audioBase64: string;
  audioMime: string;
}

export async function POST(req: NextRequest) {
  let body: { beats: ConcatBeat[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { beats } = body;
  if (!beats?.length) {
    return NextResponse.json({ error: "No beats provided" }, { status: 400 });
  }

  // Sort by beat number to guarantee correct playback order
  const sorted = [...beats].sort((a, b) => a.beatNumber - b.beatNumber);

  let fmtChunk: Buffer | null = null;
  const dataChunks: Buffer[] = [];

  for (const beat of sorted) {
    if (!beat.audioBase64) {
      return NextResponse.json(
        { error: `Beat ${beat.beatNumber} has no audio data` },
        { status: 400 }
      );
    }
    const buf = Buffer.from(beat.audioBase64, "base64");
    const parsed = parseWAV(buf);
    if (!parsed) {
      return NextResponse.json(
        { error: `Beat ${beat.beatNumber} is not a valid WAV file (mime: ${beat.audioMime})` },
        { status: 400 }
      );
    }
    if (!fmtChunk) fmtChunk = parsed.fmt;
    dataChunks.push(parsed.data);
  }

  if (!fmtChunk) {
    return NextResponse.json({ error: "No WAV format chunk found" }, { status: 500 });
  }

  const combined = buildWAV(fmtChunk, dataChunks);
  const totalDataBytes = dataChunks.reduce((s, c) => s + c.length, 0);
  const durationSec = wavDurationSec(fmtChunk, totalDataBytes);

  return NextResponse.json({
    audioBase64: combined.toString("base64"),
    audioMime: "audio/wav",
    durationSec,
  });
}
