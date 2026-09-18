// ElevenLabs Sound Effects client
// Endpoint: POST https://api.elevenlabs.io/v1/sound-generation
// Auth:     ELEVENLABS_API_KEY env var
// Returns:  { audioBase64: string; audioMime: "audio/mpeg" }

const EL_SFX_URL = "https://api.elevenlabs.io/v1/sound-generation";

export interface SfxResult {
  audioBase64: string;
  audioMime: "audio/mpeg";
}

export async function generateSfx(
  text: string,
  durationSeconds?: number,
  promptInfluence: number = 0.3
): Promise<SfxResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

  const body: Record<string, unknown> = {
    text,
    prompt_influence: promptInfluence,
  };
  if (durationSeconds !== undefined) {
    body.duration_seconds = Math.min(22, Math.max(0.5, durationSeconds));
  }

  const res = await fetch(EL_SFX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs SFX error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuf).toString("base64");
  return { audioBase64, audioMime: "audio/mpeg" };
}
