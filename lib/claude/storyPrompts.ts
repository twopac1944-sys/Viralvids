import { StoryRequest, ResolvedStoryMode, ResolvedVisualStyle } from "@/lib/types/story";
import { GenrePack } from "@/lib/genres/genres";
import { resolveStoryMode } from "@/lib/claude/resolveStoryMode";

const TARGET_WORDS: Record<StoryRequest["targetLength"], number> = {
  "30s": 75,
  "60s": 150,
  "90s": 225,
  "3min": 450,
};

const STORY_MODE_INSTRUCTIONS: Record<ResolvedStoryMode, string> = {
  dialogue: `STORY MODE: DIALOGUE (75% dialogue / 25% narration)
  The majority of beats must use voiceRole "character_[name]" — write actual spoken lines as distinct characters would say them.
  Approximately 1 in 4 beats may use voiceRole "narrator" to set scene or bridge action.
  Characters must have distinct voices: word choice, rhythm, and cadence should differ between them.
  Narration beats must be brief — they frame dialogue, they do not replace it.`,

  narration: `STORY MODE: NARRATION (pure narrator voice)
  Every beat uses voiceRole "narrator". No character dialogue.
  Write in a cinematic, authoritative narrator voice throughout — describe events from the outside.
  The narrator may hint at inner states through physical observation only (see show-don't-tell rules below).`,

  hybrid: `STORY MODE: HYBRID (balanced narrator + character voices)
  Mix narrator and character beats freely — let story structure determine the balance.
  Aim for roughly half narrator, half character-voiced beats, but prioritise what serves each narrative moment.
  Transitions between narrator and character voice should feel seamless, not abrupt.`,
};

const VISUAL_STYLE_INSTRUCTIONS: Record<ResolvedVisualStyle, string> = {
  "photorealistic": `VISUAL STYLE: PHOTOREALISTIC
  All visualPrompt fields must read as live-action cinematography direction.
  Use camera and lighting vocabulary: lens focal length, shot type, light source, color grade, film texture.
  Avoid any painted, illustrated, or animated descriptors.
  Example format: "Tight close-up, 50mm, single practical light from left, desaturated palette, photojournalistic grain, shallow depth of field"`,

  "stylized-illustration": `VISUAL STYLE: STYLIZED ILLUSTRATION
  All visualPrompt fields must read as graphic novel or concept art direction.
  Describe composition, color palette, linework quality, and painterly texture cues.
  Avoid photographic vocabulary — use art direction language instead.
  Example format: "Wide establishing panel, muted earth tones with crimson accent, bold ink outlines, painterly impasto texture, dramatic rim lighting"`,

  "anime": `VISUAL STYLE: ANIME
  All visualPrompt fields must target anime / manga visual language.
  Use dynamic camera angles, expressive character framing, and style-specific lighting descriptors.
  Reference anime visual vocabulary: cel-shading, speed lines for action, bloom for emotion, sakura / environmental atmosphere.
  Example format: "Low-angle shot, dramatic cherry blossom scatter, soft pastel rim light, expressive tear-glimmer close-up, cel-shaded, vibrant saturated palette"`,
};

function feelGoodLoopMechanic(): string {
  return `
FEEL-GOOD LOOP MECHANIC (overrides default for this genre):
The hook/loop ending pair works in the OPPOSITE direction from the standard mechanic.
  - The hook should sound uncertain, incomplete, yearning, or unresolved on first hearing.
  - The loopEnding should return to the same line or moment and make it feel earned, warm, and whole.
  - On second listen, the hook gains emotional payoff — NOT dread, NOT irony, NOT a sinister second meaning.

EXAMPLES — match this warmth-gains-depth pattern:
  Hook:       "She hadn't called her father in three years."
  Loop Ending: "She hadn't called her father in three years. Now she didn't have to — he was standing at her door."

  Hook:       "He always kept the extra chair at the table."
  Loop Ending: "He always kept the extra chair at the table. Tonight, for the first time, it wasn't empty."`;
}

function tensionCurveSection(isFeelGood: boolean): string {
  if (isFeelGood) {
    return `ENDING GUARANTEE (Feel-Good genre — replaces tension curve rule):
  The resolution must be genuinely positive. No twist that undercuts the happy ending, no last-second dread, no ironic reversal.
  The FALSE RELIEF BEAT RULE is SKIPPED for this genre entirely — the relief IS the real ending, not a setup for a gut-punch.
  Every beat should move toward warmth, connection, or resolution. The emotional arc is: uncertainty → hope → earned joy.`;
  }

  return `TENSION CURVE — FALSE RELIEF BEAT (applies to stories with 5+ beats only):
  Exactly one beat in the back half of the story (after the midpoint beat, before the final beat) must function as a FALSE RELIEF beat — a moment where the character or narration signals safety, resolution, or calm. The final beat then undercuts it.
  - This beat's emotion tag must be "calm" or "hopeful."
  - Its visualPrompt must reflect genuine calm: well-lit, open space, relaxed posture, soft light. Make the contrast with the final beat's visuals stark.
  - The false relief must feel earned, not cheap — the character genuinely believes the threat is over.
  For stories under 5 beats: skip this rule. There is not enough room for it to land without feeling rushed.`;
}

export function buildStoryPrompt(
  request: StoryRequest,
  genre: GenrePack,
  resolvedVisualStyle: ResolvedVisualStyle
): { system: string; user: string; resolvedStoryMode: ResolvedStoryMode } {
  const resolvedStoryMode = resolveStoryMode(request.storyMode ?? "auto");
  const targetWords = TARGET_WORDS[request.targetLength];
  const tone = request.tone;
  const isFeelGood = genre.id === "feel-good";
  const hasDialogue = resolvedStoryMode === "dialogue" || resolvedStoryMode === "hybrid";

  const seriesSection = request.seriesMode && request.seriesContext
    ? `
SERIES CONTEXT (Episode ${request.episodeNumber ?? "?"}):
${request.seriesContext}
The hook of this episode must connect to events from prior episodes in a way that rewards returning viewers while still making sense to new ones. The loop ending must tease forward into the next episode.`
    : "";

  const characterStep = hasDialogue ? `
STEP 7 — BUILD THE CHARACTERS ARRAY.
  For every named character who speaks in any beat (voiceRole "character_[name]"), create one entry:
  - name: the character's name (no prefix, e.g. "Elena" not "character_Elena")
  - voiceRole: the exact voiceRole string used in their beats (e.g. "character_Elena")
  - physicalDescription: 2-4 sentences of specific, visually concrete physical detail.
    Include: approximate age, build, hair (color, length, style), eyes, any notable features.
    Be specific enough that an image model could recreate this face consistently across multiple generations.
  - lockedTraits: extract exactly 2-3 of the most distinctive, hard-to-miss identifying details
    from physicalDescription as short phrases, e.g. ["late 20s", "shoulder-length black hair with side part", "small scar above left eyebrow"]
  - voiceNotes: 1 sentence on how this character speaks — vocabulary, pace, register, verbal habits.
  For narration-only beats: characters array is [].` : `
STEP 7 — CHARACTERS ARRAY.
  This story uses narration mode only. Set characters to an empty array [].`;

  const system = `You are a master short-form storytelling engine. You write viral, emotionally gripping narratives for social video platforms (TikTok, YouTube Shorts, Instagram Reels).

GENRE: ${genre.name}
GENRE DESCRIPTION: ${genre.description}
TONE: ${tone}
VOICE STYLE: ${genre.voiceStyleNotes}
VISUAL STYLE KEYWORDS (embed these naturally in visualPrompt fields): ${genre.visualStyleKeywords.join(", ")}
${seriesSection}

${STORY_MODE_INSTRUCTIONS[resolvedStoryMode]}

${VISUAL_STYLE_INSTRUCTIONS[resolvedVisualStyle]}

YOUR TASK:
Generate a complete story in the following STRICT ORDER:

STEP 1 — WRITE THE HOOK AND LOOP ENDING AS A LINKED PAIR FIRST.
  - The hook is the opening line (first ~3 seconds). It must be an immediate, irresistible entry point.
  - The loopEnding is the final line. It must recontextualize the hook — hearing it should make the viewer want to watch from the beginning again. The ending loops back to the hook emotionally or literally.
  - Design these two lines as one unit before writing anything else.
${isFeelGood ? feelGoodLoopMechanic() : ""}

STEP 2 — BUILD THE MIDDLE using this arc:
  Setup → Rising Tension → Complication → Twist → Resolution
  The resolution should land on the loopEnding line.

STEP 3 — BREAK INTO 5–8 BEATS.
  Each beat is one distinct narrative moment. Duration is calculated at 2.5 words per second.
  Beat 1 must contain or open with the hook line.
  The final beat must end with the loopEnding line.

${tensionCurveSection(isFeelGood)}

STEP 4 — FOR EACH BEAT, assign:
  - narration: the spoken narration text for that beat
  - voiceRole: "narrator" for narration; use "character_[name]" if there is dialogue from a named character
  - emotion: exactly one from this set: tense | dark | hopeful | mysterious | urgent | calm | triumphant | melancholic
  - visualPrompt: write in the VISUAL STYLE specified above — see style instructions for exact format and vocabulary
  - durationSec: word count of narration ÷ 2.5, rounded to nearest integer (minimum 3)

VISUAL FRAMING RULE FOR DIALOGUE BEATS:
  When a beat's voiceRole is "character_[name]" (a named character is speaking), write the visualPrompt
  as a SINGLE-CHARACTER frame — close-up or medium shot of ONLY that speaking character.
  Do NOT place two characters in the same generated frame.
  A two-person conversation must alternate: one character per beat, shot/reverse-shot convention.
  This is required because multi-character shots break identity consistency in AI image generation.
  Narrator beats may frame scenes more broadly (establishing shots, environment, action sequences).

SHOW-DON'T-TELL CONSTRAINT (applies to every narration field):
  Narration must describe actions and sensory detail only. Never name the emotion or intent behind them.
  Ban all filler clauses that state purpose or feeling directly. Prohibited constructions include:
    "to calm down," "to be sure," "in fear," "feeling anxious," "nervously," "in order to," "hoping that," "trying to"
  If a beat must convey a character's internal state, do it through a physical action or detail instead:
    a shaking hand, a held breath, a repeated glance, a door checked twice.

  BEFORE / AFTER EXAMPLES — match this pattern exactly:
    ✗ Before: "She sat on the bed to calm down and listened to the silence."
    ✓ After:  "She sat on the bed. Listened to the silence."

    ✗ Before: "He checked the lock again, feeling anxious something was wrong."
    ✓ After:  "He checked the lock. Then checked it again."

    ✗ Before: "She stayed very still, hoping the footsteps would pass."
    ✓ After:  "She stayed very still. The footsteps kept coming."

STEP 5 — GENERATE THREE PLATFORM VARIANTS by rewriting the beat list at different word counts:
  - tiktok30: ~75 words total across all beats (3–4 beats, still contains hook + loopEnding)
  - shorts55: ~140 words total (5–6 beats, still contains hook + loopEnding)
  - reels90: ~225 words total (6–8 beats, still contains hook + loopEnding)
  Each variant is a complete, standalone beat array — not just a subset of the main beats.

  COMPRESSION INTEGRITY RULES (non-negotiable for all three variants):
  1. The hook line (Beat 1 narration opening) and the loopEnding line (final beat narration close) must be word-for-word identical across all three variants and the main beats. Never alter, shorten, or paraphrase them. They carry the loop mechanic.
  2. Only middle beats may be cut, merged, or trimmed to hit target word counts.
  3. When cutting beats from the tiktok30 variant, the false-relief beat is the first candidate to cut — but hook and loopEnding are never touched.
  4. Before finalising each variant, mentally verify: does removing any beat strip context that the loopEnding depends on? If so, keep that beat and cut a different one.

STEP 6 — COUNT total words across all main beats' narration fields.
${characterStep}

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
  "characters": Character[],
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

Where Character is:
{
  "name": string,
  "voiceRole": string,
  "physicalDescription": string,
  "lockedTraits": string[],
  "voiceNotes": string
}

Platform variant beats should have beatNumber starting from 1 within their own array.`;

  const user = `Write a ${tone} ${genre.name} story targeting approximately ${targetWords} words of narration (${request.targetLength} runtime).

Make it scroll-stopping. The hook must land in under 3 seconds of reading. The loopEnding must make the viewer want to watch again immediately.`;

  return { system, user, resolvedStoryMode };
}
