import { Character, StoryBeat } from "@/lib/types/story";
import { submitTask } from "@/lib/wavespeed/client";

const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 90; // 6 minutes — video generation is slower than image

async function pollVideo(predictionId: string): Promise<string> {
  const key = process.env.WAVESPEED_API_KEY;
  if (!key) throw new Error("WAVESPEED_API_KEY is not set");

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${WAVESPEED_BASE}/predictions/${predictionId}/result`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`WaveSpeed video poll failed (${res.status}): ${text}`);
    }

    const json = await res.json();
    const { status, outputs, error } = json.data;

    if (status === "completed") {
      const url = outputs?.[0];
      if (!url) throw new Error("WaveSpeed video: completed but no output URL");
      return url;
    }

    if (status === "failed" || status === "cancelled" || status === "timeout") {
      throw new Error(`WaveSpeed video ${status}: ${error ?? "no details"}`);
    }
    // "processing" | "queued" — keep polling
  }

  throw new Error(`WaveSpeed video timed out after ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s`);
}

/**
 * Generate a short video clip of a character using PixVerse C1 Reference-to-Video.
 * The character's referenceImageUrl locks their visual identity via @ref_name syntax.
 * Returns a publicly accessible video URL.
 */
export async function generateCharacterVideo(
  character: Character,
  beat: StoryBeat
): Promise<string> {
  if (!character.referenceImageUrl) {
    throw new Error(`Character "${character.name}" has no reference image — generate the character sheet first`);
  }

  // Derive a safe alphanumeric ref_name from character name (PixVerse requirement)
  const refName = character.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "char";

  // Prepend @refName to anchor identity, then use the beat's visualPrompt for composition.
  // The single-character framing rule means visualPrompt already describes only this character.
  const prompt = `@${refName} ${beat.visualPrompt}. The character is speaking or reacting with natural facial expression and subtle movement.`;

  // Clamp to PixVerse's 1–15s range; minimum 3s so the lipsync has something to work with
  const duration = Math.max(3, Math.min(15, Math.round(beat.durationSec)));

  const predictionId = await submitTask("pixverse/pixverse-c1/reference-to-video", {
    prompt,
    images: [
      {
        image: character.referenceImageUrl,
        type: "subject",
        ref_name: refName,
      },
    ],
    aspect_ratio: "9:16",
    resolution: "720p",
    duration,
    generate_audio_switch: false, // Chatterbox audio is applied via lipsync step
  });

  return pollVideo(predictionId);
}
