// Sound Effects client — WaveSpeed Kling Text-to-Audio
// Endpoint: POST https://api.wavespeed.ai/api/v3/kwaivgi/kling-text-to-audio
// Auth:     WAVESPEED_API_KEY (same key as all other WaveSpeed calls)
// Pricing:  $0.035 flat per run
// Returns:  { audioBase64: string; audioMime: "audio/mpeg" }

import { generate } from "@/lib/wavespeed/client";

export interface SfxResult {
  audioBase64: string;
  audioMime: "audio/mpeg";
}

export async function generateSfx(
  text: string,
  durationSeconds: number = 10,
  // promptInfluence retained for interface compatibility — not used by Kling
  _promptInfluence: number = 0.3
): Promise<SfxResult> {
  if (!process.env.WAVESPEED_API_KEY) throw new Error("WAVESPEED_API_KEY not configured");

  // Clamp to Kling's accepted range
  const duration = Math.max(1, Math.min(30, Math.round(durationSeconds)));

  const audioUrl = await generate("kwaivgi/kling-text-to-audio", {
    prompt: text,
    duration,
  });

  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Failed to download SFX audio: ${res.status}`);

  const arrayBuf = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuf).toString("base64");
  return { audioBase64, audioMime: "audio/mpeg" };
}
