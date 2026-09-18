import { NextRequest, NextResponse } from "next/server";
import { generateMusic } from "@/lib/audio/elevenLabsMusic";

interface MusicRequestBody {
  musicDirection: string;
  durationSeconds?: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 503 });
  }

  let body: MusicRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.musicDirection || typeof body.musicDirection !== "string") {
    return NextResponse.json({ error: "musicDirection is required" }, { status: 400 });
  }

  try {
    const result = await generateMusic(body.musicDirection, body.durationSeconds ?? 90);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
