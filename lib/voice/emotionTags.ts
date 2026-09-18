import { Emotion } from "@/lib/types/story";

/**
 * Candidate audio tags per emotion — reference data for the direction pass.
 * The direction prompt selects from these based on what fits the specific line
 * and character, not applying the same tag mechanically every time the emotion repeats.
 *
 * Bracketed inline-tag syntax: [tag] inserted before the phrase it shapes.
 */
export const EMOTION_TAGS: Record<Emotion, string[]> = {
  tense: [
    "tense",
    "voice tightens",
    "quietly urgent",
    "barely audible",
    "measured",
  ],
  dark: [
    "low",
    "flat",
    "coldly",
    "without affect",
    "hollow",
  ],
  hopeful: [
    "warmly",
    "softly",
    "hopeful",
    "gently rising",
    "with quiet conviction",
  ],
  mysterious: [
    "whispers",
    "slow",
    "deliberate",
    "hushed",
    "with weight",
  ],
  urgent: [
    "urgent",
    "fast",
    "clipped",
    "breathless",
    "sharp",
  ],
  calm: [
    "calmly",
    "even",
    "unhurried",
    "steady",
    "grounded",
  ],
  triumphant: [
    "strong",
    "full voice",
    "rising",
    "with conviction",
    "expansive",
  ],
  melancholic: [
    "sadly",
    "sighs",
    "wistfully",
    "quiet",
    "trailing off",
  ],
};
