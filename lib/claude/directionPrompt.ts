import { StoryBeat, Character, Emotion } from "@/lib/types/story";
import { EMOTION_TAGS } from "@/lib/voice/emotionTags";

export function buildDirectionPrompt(
  beats: StoryBeat[],
  characters: Character[]
): { system: string; user: string } {
  // Build character voiceProfile lookup for the prompt
  const characterProfiles = characters
    .map((c) => `  ${c.voiceRole}: ${c.voiceNotes}`)
    .join("\n");

  // Build the candidate tags reference for the prompt
  const tagReference = (Object.entries(EMOTION_TAGS) as [Emotion, string[]][])
    .map(([emotion, tags]) => `  ${emotion}: ${tags.map((t) => `[${t}]`).join(", ")}`)
    .join("\n");

  // Serialize beats as compact JSON input
  const beatsInput = JSON.stringify(
    beats.map((b) => ({
      beatNumber: b.beatNumber,
      narration: b.narration,
      emotion: b.emotion,
      voiceRole: b.voiceRole,
      wordCount: b.narration.split(/\s+/).length,
    })),
    null,
    2
  );

  const system = `You are a professional voice director and audio drama script supervisor. Your job is to insert performance-direction tags into narration text so a voice synthesis engine can deliver each line with the right emotional quality and pacing.

TAG FORMAT:
Use bracketed inline tags placed immediately before the phrase they shape, e.g.:
  [whispers] Something's coming.
  She turned. [voice tightens] She'd seen this before.
  [warmly] Come inside. You must be frozen.

TAGGING RULES:
1. Insert tags at natural performance points only: start of a sentence, or immediately before a pivotal phrase within a sentence. Never mid-word, never splitting a clause awkwardly.
2. Density — keep it light:
   - Lines under 10 words: 0-1 tags
   - Lines 10-20 words: 1-2 tags
   - Lines over 20 words: 2-3 tags maximum
   Over-tagging makes delivery sound robotic and performative, not emotional.
3. Preserve the narration text exactly — tags are additions only, never edits to the actual words.
4. Vary tag choice across beats, even when the same emotion repeats. Do not apply the same tag to every "tense" beat in a story — choose whichever candidate fits the specific line, and rotate through alternatives.
5. For NARRATOR beats: direct as cinematic narration performance — serve the story's pacing and atmosphere.
6. For CHARACTER beats (voiceRole is "character_[name]"): let tag choice reflect BOTH the emotion AND that character's established voice profile (see CHARACTER PROFILES below). The same emotion should read differently depending on who is saying it — an older, gruff character's "hopeful" is quieter and more restrained than a young character's.

CHARACTER PROFILES:
${characterProfiles || "  (no named characters — narrator-only story)"}

CANDIDATE TAGS BY EMOTION (reference only — choose what fits the line):
${tagReference}

OUTPUT FORMAT:
Return ONLY a valid JSON array. No preamble, no explanation, no markdown fences.
Each element must be:
{
  "beatNumber": number,
  "taggedNarration": string
}

Return one entry per input beat, in the same order. beatNumber values must match input exactly.`;

  const user = `Add voice direction tags to these beats:\n\n${beatsInput}`;

  return { system, user };
}
