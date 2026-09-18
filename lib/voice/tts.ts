// Strip [direction] tags before sending to TTS — they're voice notes, not TTS markup
export function stripDirectionTags(text: string): string {
  return text.replace(/\[[^\]]+\]/g, "").replace(/\s{2,}/g, " ").trim();
}

// Consistent voices per role. narrator → "ara"; characters cycle through a set hashed on name.
const NARRATOR_VOICE = "ara";
const CHARACTER_VOICES = ["eve", "leo", "rex", "sal", "sky", "nova"];

export function voiceForRole(voiceRole: string): string {
  if (voiceRole === "narrator") return NARRATOR_VOICE;
  const name = voiceRole.replace(/^character_/i, "");
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CHARACTER_VOICES[h % CHARACTER_VOICES.length];
}

export interface BeatAudio {
  beatNumber: number;
  voiceRole: string;
  voice: string;
  cleanText: string;
  audioBase64: string; // mp3
}

export async function synthesizeBeat(
  beatNumber: number,
  narration: string,
  voiceRole: string
): Promise<BeatAudio> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");

  const cleanText = stripDirectionTags(narration);
  const voice = voiceForRole(voiceRole);

  const res = await fetch("https://api.x.ai/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-tts-beta",
      input: cleanText,
      voice,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Grok TTS error ${res.status}: ${body.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(buffer).toString("base64");

  return { beatNumber, voiceRole, voice, cleanText, audioBase64 };
}
