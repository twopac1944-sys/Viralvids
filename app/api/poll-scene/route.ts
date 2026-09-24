import { NextRequest, NextResponse } from "next/server";

const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";

// GET /api/poll-scene?taskId=xxx
// Returns current WaveSpeed task status + videoUrl when complete.
export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "WAVESPEED_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`${WAVESPEED_BASE}/predictions/${taskId}/result`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      return NextResponse.json({ error: `WaveSpeed poll failed: ${text}` }, { status: 502 });
    }

    const json = await res.json();
    const { status, outputs, error } = json.data ?? {};

    if (status === "completed") {
      return NextResponse.json({ status: "complete", videoUrl: outputs?.[0] ?? null });
    }
    if (status === "failed" || status === "cancelled" || status === "timeout") {
      return NextResponse.json({ status: "failed", error: error ?? status });
    }
    // queued / processing
    return NextResponse.json({ status: "rendering" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
