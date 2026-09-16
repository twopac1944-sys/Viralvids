import { StoryRequest } from "@/lib/types/story";
import { GenrePack } from "@/lib/genres/genres";

const TARGET_WORDS: Record<StoryRequest["targetLength"], number> = {
  "30s": 75,
  "60s": 150,
  "90s": 225,
  "3min": 450,
};

export function buildStoryPrompt(
  request: StoryRequest,
  genre: GenrePack
): { system: string; user: string } {
  const targetWords = TARGET_WORDS[request.targetLength];
  const tone = request.tone;

  const seriesSection = request.seriesMode && request.seriesContext
    ? `
SERIES CONTEXT (Episode ${request.episodeNumber ?? "?"}):
${request.seriesContext}
The hook of this episode must connect to events from prior episodes in a way that rewards returning viewers while still making sense to new ones. The loop ending must tease forward into the next episode.`
    : "";

  const system = `You are a master short-form storytelling engine. You write viral, emotionally gripping narratives for social video platforms (TikTok, YouTube Shorts, Instagram Reels).

GENRE: ${genre.name}
GENRE DESCRIPTION: ${genre.description}
TONE: ${tone}
VOICE STYLE: ${genre.voiceStyleNotes}
VISUAL STYLE KEYWORDS (embed these naturally in visualPrompt fields): ${genre.visualStyleKeywords.join(", ")}
${seriesSection}

YOUR TASK:
Generate a complete story in the following STRICT ORDER:

STEP 1 — WRITE THE HOOK AND LOOP ENDING AS A LINKED PAIR FIRST.
  - The hook is the opening line (first ~3 seconds). It must be an immediate, irresistible entry point.
  - The loopEnding is the final line. It must recontextualize the hook — hearing it should make the viewer want to watch from the beginning again. The ending loops back to the hook emotionally or literally.
  - Design these two lines as one unit before writing anything else.

STEP 2 — BUILD THE MIDDLE using this arc:
  Setup → Rising Tension → Complication → Twist → Resolution
  The resolution should land on the loopEnding line.

STEP 3 — BREAK INTO 5–8 BEATS.
  Each beat is one distinct narrative moment. Duration is calculated at 2.5 words per second.
  Beat 1 must contain or open with the hook line.
  The final beat must end with the loopEnding line.

STEP 4 — FOR EACH BEAT, assign:
  - narration: the spoken narration text for that beat
  - voiceRole: "narrator" for narration; use "character_[name]" if there is dialogue from a named character
  - emotion: exactly one from this set: tense | dark | hopeful | mysterious | urgent | calm | triumphant | melancholic
  - visualPrompt: a cinematic image/video generation prompt incorporating the genre's visual style keywords. Be specific: camera angle, lighting, subject, mood.
  - durationSec: word count of narration ÷ 2.5, rounded to nearest integer (minimum 3)

STEP 5 — GENERATE THREE PLATFORM VARIANTS by rewriting the beat list at different word counts:
  - tiktok30: ~75 words total across all beats (3–4 beats, still contains hook + loopEnding)
  - shorts55: ~140 words total (5–6 beats, still contains hook + loopEnding)
  - reels90: ~225 words total (6–8 beats, still contains hook + loopEnding)
  Each variant is a complete, standalone beat array — not just a subset of the main beats.

STEP 6 — COUNT total words across all main beats' narration fields.

OUTPUT FORMAT:
Return ONLY valid JSON. No preamble. No markdown fences. No explanation. No trailing text.
The JSON must exactly match this TypeScript type:

{
  "genre": string,
  "tone": string,
  "hook": string,
  "loopEnding": string,
  "beats": StoryBeat[],
  "totalWordCount": number,
  "platformVariants": {
    "tiktok30": StoryBeat[],
    "shorts55": StoryBeat[],
    "reels90": StoryBeat[]
  }
}

Where StoryBeat is:
{
  "beatNumber": number,
  "narration": string,
  "voiceRole": string,
  "emotion": "tense" | "dark" | "hopeful" | "mysterious" | "urgent" | "calm" | "triumphant" | "melancholic",
  "visualPrompt": string,
  "durationSec": number
}

Platform variant beats should have beatNumber starting from 1 within their own array.`;

  const user = `Write a ${tone} ${genre.name} story targeting approximately ${targetWords} words of narration (${request.targetLength} runtime).

Make it scroll-stopping. The hook must land in under 3 seconds of reading. The loopEnding must make the viewer want to watch again immediately.`;

  return { system, user };
}
