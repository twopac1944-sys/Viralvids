// fal.ai Chatterbox TTS client
// Endpoint: fal-ai/chatterbox/text-to-speech (direct, synchronous)
// Auth:     FAL_API_KEY env var
// Returns:  { audioBase64: string; audioMime: string }

const FAL_DIRECT_URL = "https://fal.run/fal-ai/chatterbox/text-to-speech";

export interface ChatterboxResult {
  audioBase64: string;
  audioMime: string;
  /** Original fal.ai CDN URL — publicly accessible, valid for the session. Used as lipsync audio source. */
  audioUrl: string;
}

export async function synthesizeChatterbox(
  text: string,
  referenceAudioUrl: string,
  exaggeration: number,
  cfg: number,
  temperature: number = 0.8
): Promise<ChatterboxResult> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error("FAL_API_KEY not configured");

  const seed = Math.floor(Math.random() * 2_147_483_647);
  // fal.ai enforces exaggeration ≤ 1.0 and cfg ∈ [0,1]
  const clampedExaggeration = Math.min(1.0, Math.max(0, exaggeration));
  const clampedCfg = Math.min(1.0, Math.max(0, cfg));

  const res = await fetch(FAL_DIRECT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      text,
      seed,
      exaggeration: clampedExaggeration,
      cfg: clampedCfg,
      temperature,
      audio_url: referenceAudioUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Chatterbox error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();

  // fal.ai response shape: { audio: { url, content_type } }
  const audioUrl: string | undefined = json?.audio?.url;
  const contentType: string = json?.audio?.content_type ?? "audio/wav";

  if (!audioUrl) {
    throw new Error(`Chatterbox: no audio URL in response — ${JSON.stringify(json).slice(0, 200)}`);
  }

  // Fetch the audio file from the CDN URL and return as base64
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error(`Chatterbox: failed to fetch audio from CDN (${audioRes.status})`);

  const buffer = await audioRes.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString("base64");

  return { audioBase64, audioMime: contentType, audioUrl };
}
