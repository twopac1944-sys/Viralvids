import { getGenre } from "@/lib/genres/genres";

export interface SceneStoryRequest {
  genre: string;
  premise: string;
  tone: "dark" | "neutral" | "uplifting";
  targetLengthSeconds: 30 | 60 | 90 | 180;
  seriesContext?: { episodeNumber: number; priorEpisodeSummary: string };
  hookNote?: string;
  loopEndingNote?: string;
  manualOutline?: string;
  brandEmbed?: { brandName: string };
}

const SCENE_COUNT: Record<number, string> = {
  30:  "2 scenes",
  60:  "3–4 scenes",
  90:  "4–5 scenes",
  180: "6–8 scenes",
};

export function buildSceneStoryPrompt(req: SceneStoryRequest): { system: string; user: string } {
  const genre = getGenre(req.genre);
  const genreName        = genre?.name              ?? req.genre;
  const genreDescription = genre?.description       ?? "";
  const voiceStyleNotes  = genre?.voiceStyleNotes   ?? "";
  const visualKeywords   = genre?.visualStyleKeywords?.join(", ") ?? "";
  const sceneCount       = SCENE_COUNT[req.targetLengthSeconds] ?? "3–4 scenes";

  const seriesBlock = req.seriesContext
    ? `
SERIES CONTEXT (Episode ${req.seriesContext.episodeNumber}):
${req.seriesContext.priorEpisodeSummary}
The first scene's opening dialogue must connect to events from prior episodes in a way that rewards returning viewers while still making sense to new ones. The final scene's last line must tease forward into what comes next.`
    : "";

  const outlineBlock = req.manualOutline
    ? `MANUAL STORY OUTLINE (optional):
If manualOutline is provided, treat it as the user's own story — follow it closely. Do not invent a different plot, characters, or events beyond what it implies. Your job is to break the given outline into scenes and add scene-level production detail (camera, color grade, sound FX, music, dialogue phrasing consistent with the outline) — not to originate the narrative.

OUTLINE:
${req.manualOutline}`
    : "";

  const hookBlock = `HOOK (Scene 1):
The first scene's dialogue must open with a line that creates immediate tension, stakes, or a question the viewer needs answered — never a greeting, never scene-setting small talk. The viewer decides whether to keep watching within the first 1-2 seconds of audio, so the very first line of dialogue carries that weight. Avoid soft openers like "Hey" or "So..." — start mid-conflict or mid-consequence.

Bad: "Hey, you're finally here."
Good: "You're late. That's twice now."

${req.hookNote
    ? `hookNote (follow this precisely instead of the generic rule above): ${req.hookNote}`
    : `No hookNote provided — apply the generic tension opener above.`}

LOOP ENDING (Final Scene):
The final scene's last line of dialogue, or the final beat of action, must create a sense of unresolved tension or a callback that makes the video want to be watched again — the story should feel like it could loop directly back to scene 1 without a hard narrative stop. Avoid clean resolutions, morals, or lines that signal "the end." Favor an ending that either mirrors the opening line/image, poses a new question, or cuts on an action rather than a conclusion.

Bad: "And that's how we finally solved it."
Good: "Don't call me again." [cuts before any reaction — no resolution shown]

${req.loopEndingNote
    ? `loopEndingNote (follow this precisely instead of the generic rule above): ${req.loopEndingNote}`
    : `No loopEndingNote provided — apply the generic loop pattern above.`}`;

  const system = `You are a story engine for a short-form dialogue-driven video pipeline. Each scene you write will be rendered as a distinct video clip by MiniMax H3 (5–15 seconds per clip), then assembled into a final video. Write for this format: scenes are visual and dialogue-driven, not narrated.

GENRE: ${genreName}${genreDescription ? `\nGENRE DESCRIPTION: ${genreDescription}` : ""}
TONE: ${req.tone}${voiceStyleNotes ? `\nVOICE STYLE: ${voiceStyleNotes}` : ""}${visualKeywords ? `\nVISUAL KEYWORDS (embed naturally in sceneDescription and colorGrade): ${visualKeywords}` : ""}
TARGET LENGTH: ~${req.targetLengthSeconds} seconds → write ${sceneCount}. Each scene should be 5–15 seconds of content.
${seriesBlock}
${outlineBlock ? `\n${outlineBlock}\n` : ""}
${hookBlock}

${req.brandEmbed
    ? `NATIVE BRAND PLACEMENT:
Work "${req.brandEmbed.brandName}" naturally into the story's environment — a visible sign, billboard, package, flyer, or storefront within one or two scenes — as pure background world-building. It must read as scenery, not an advertisement: no character should comment on, use, or reference the brand in dialogue. Choose the single most natural placement type for the story's setting and describe it briefly within sceneDescription, e.g. "a lit ${req.brandEmbed.brandName} sign glows faintly in the storefront window behind them." Do not force it into a scene where it wouldn't naturally exist — one well-placed instance beats two forced ones.`
    : `BRAND PLACEMENT: None. Do not introduce any brand names or product placements.`}

SCENE WRITING RULES:
- Favor dialogue over narration. Every scene must have at least one dialogue line.
- Each dialogue line must be words a real person actually speaks aloud — no third-person narration disguised as dialogue.
- Keep colorGrade and setting consistent across scenes unless the story explicitly changes location.
- Camera angles should serve the emotional beat of the scene. Favor close-ups for high-tension dialogue, wider shots for establishing or release moments.
- soundFx must be diegetic and specific: "rain on glass," "footsteps on gravel" — not "tense ambient."
- musicCue is a brief production note: "low cello drone, no percussion" — not a song title.

CHARACTER RULES:
- Assign every character a stable id (e.g. "char_elena") used consistently across all scenes.
- appearance must be specific enough for an image model to recreate this face consistently: approximate age, build, hair (color, length, style), eyes, any notable features.
- Never put two characters in the same sceneDescription frame during a dialogue exchange — alternate single-character close-ups (shot/reverse-shot).

OUTPUT FORMAT:
Return ONLY valid JSON. No preamble, no markdown fences, no explanation, no trailing text.

{
  "title": string,
  "characters": [
    {
      "id": string,
      "name": string,
      "appearance": string,
      "personalityNote": string,
      "voiceOnly": boolean  // true if this character is never seen on screen (phone/offscreen/voice-only); false for all visual characters
    }
  ],
  "scenes": [
    {
      "sceneId": number,
      "setting": string,
      "sceneDescription": string,
      "camera": { "angle": string, "movement": string },
      "colorGrade": string,
      "dialogue": [ { "characterId": string, "line": string, "delivery": string } ],
      "soundFx": string[],
      "musicCue": string
    }
  ]
}`;

  const user = req.manualOutline
    ? `Genre: ${genreName}
Tone: ${req.tone}
Premise: ${req.premise}
Manual Outline: ${req.manualOutline}

Break this outline into ${sceneCount} for a ~${req.targetLengthSeconds}-second video. Follow the outline's story closely — add production detail only. Apply all hook and loop ending rules exactly.`
    : `Genre: ${genreName}
Tone: ${req.tone}
Premise: ${req.premise}

Write ${sceneCount} for a ~${req.targetLengthSeconds}-second video. Apply all hook and loop ending rules exactly.`;

  return { system, user };
}
