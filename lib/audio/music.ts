// Music Generation client — WaveSpeed ACE-Step Prompt-to-Audio
// Endpoint: POST https://api.wavespeed.ai/api/v3/wavespeed-ai/ace-step/prompt-to-audio
// Auth:     WAVESPEED_API_KEY (same key as all other WaveSpeed calls)
// Pricing:  $0.0002/second (60s track = ~$0.012)
// Returns:  { audioBase64: string; audioMime: "audio/mpeg" }
//
// instrumental: true produces vocal-free output — perfect for background bed.
// duration: 5–240 seconds.

import { generate } from "@/lib/wavespeed/client";

export interface MusicResult {
  audioBase64: string;
  audioMime: "audio/mpeg";
}

export async function generateMusic(
  prompt: string,
  durationSeconds: number = 90
): Promise<MusicResult> {
  if (!process.env.WAVESPEED_API_KEY) throw new Error("WAVESPEED_API_KEY not configured");

  // Clamp to ACE-Step's accepted range
  const duration = Math.max(5, Math.min(240, Math.round(durationSeconds)));

  const audioUrl = await generate("wavespeed-ai/ace-step/prompt-to-audio", {
    prompt,
    instrumental: true,
    duration,
  });

  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Failed to download music audio: ${res.status}`);

  const arrayBuf = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuf).toString("base64");
  return { audioBase64, audioMime: "audio/mpeg" };
}
