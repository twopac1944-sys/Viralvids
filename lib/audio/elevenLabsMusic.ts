// ElevenLabs Music Generation client
// Endpoint: POST https://api.elevenlabs.io/v1/text-to-music
// Auth:     ELEVENLABS_API_KEY env var
// Returns:  { audioBase64: string; audioMime: "audio/mpeg" }

const EL_MUSIC_URL = "https://api.elevenlabs.io/v1/text-to-music";

export interface MusicResult {
  audioBase64: string;
  audioMime: "audio/mpeg";
}

export async function generateMusic(
  prompt: string,
  durationSeconds: number = 90
): Promise<MusicResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

  const res = await fetch(EL_MUSIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      prompt,
      duration_seconds: Math.min(300, Math.max(10, durationSeconds)),
      // loop-friendly ending for repeat plays
      make_instrumental: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ElevenLabs Music error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuf).toString("base64");
  return { audioBase64, audioMime: "audio/mpeg" };
}
