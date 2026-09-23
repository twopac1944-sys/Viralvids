import { NextRequest, NextResponse } from "next/server";

// POST /api/voice-reference
// Body: FormData with `clip` (audio/video file) and `characterId`
// Uploads the voice reference clip to Supabase Storage and returns the public URL.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const clip = formData.get("clip") as File | null;
    const characterId = formData.get("characterId") as string | null;

    if (!clip || !characterId) {
      return NextResponse.json({ error: "clip and characterId are required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const ext = clip.name.split(".").pop() ?? "mp4";
    const path = `voice-refs/${characterId}-${Date.now()}.${ext}`;
    const bytes = await clip.arrayBuffer();

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/voice-references/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": clip.type || "audio/mpeg"
        },
        body: bytes
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: `Storage upload failed: ${err}` }, { status: 502 });
    }

    const voiceReferenceUrl = `${supabaseUrl}/storage/v1/object/public/voice-references/${path}`;
    return NextResponse.json({ voiceReferenceUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Voice reference upload failed" }, { status: 500 });
  }
}
