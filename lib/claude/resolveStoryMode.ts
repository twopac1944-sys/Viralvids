import { StoryMode, ResolvedStoryMode } from "@/lib/types/story";

/**
 * Resolves the requested story mode to a concrete mode.
 * "auto" -> weighted random: 75% dialogue, 25% narration (genre-blind).
 * Any explicit mode is returned unchanged — user choice always wins.
 */
export function resolveStoryMode(requestedMode: StoryMode): ResolvedStoryMode {
  if (requestedMode !== "auto") return requestedMode;
  return Math.random() < 0.75 ? "dialogue" : "narration";
}
