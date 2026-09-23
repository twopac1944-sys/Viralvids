import { NextRequest, NextResponse } from "next/server";

// POST /api/upload-image
// Body: FormData with `file` (image) and `folder` (e.g. "brand-logos" or "character-refs")
// Uploads to Supabase Storage and returns { url }.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "uploads";

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${folder}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/viralvid-assets/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": file.type || "image/jpeg",
        },
        body: bytes,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return NextResponse.json({ error: `Storage upload failed: ${err}` }, { status: 502 });
    }

    const url = `${supabaseUrl}/storage/v1/object/public/viralvid-assets/${path}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Image upload failed" }, { status: 500 });
  }
}
