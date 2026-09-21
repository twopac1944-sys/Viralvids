import { submitTask } from "@/lib/wavespeed/client";

const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // 3 minutes — lipsync is faster than generation

async function pollLipsync(predictionId: string): Promise<string> {
  const key = process.env.WAVESPEED_API_KEY;
  if (!key) throw new Error("WAVESPEED_API_KEY is not set");

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${WAVESPEED_BASE}/predictions/${predictionId}/result`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Lipsync poll failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const { status, outputs, error } = json.data;

    if (status === "completed") {
      const url = outputs?.[0];
      if (!url) throw new Error("Lipsync: completed but no output URL");
      return url;
    }

    if (status === "failed" || status === "cancelled" || status === "timeout") {
      throw new Error(`Lipsync ${status}: ${error ?? "no details"}`);
    }
    // "processing" | "queued" — keep polling
  }

  throw new Error(`Lipsync timed out after ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s`);
}

/**
 * Apply Sync Lipsync 3 to reanimate a character's mouth movements to match Chatterbox audio.
 * @param videoUrl  - Generated character video from PixVerse C1 (publicly accessible URL)
 * @param audioUrl  - Chatterbox synthesized audio URL (fal.ai CDN, publicly accessible)
 * @returns Lip-synced video URL
 */
export async function syncLipsync(videoUrl: string, audioUrl: string): Promise<string> {
  const predictionId = await submitTask("sync/lipsync-3", {
    video: videoUrl,
    audio: audioUrl,
    sync_mode: "cut_off", // trim video to audio length if needed
  });

  return pollLipsync(predictionId);
}
