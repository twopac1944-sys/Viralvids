export type StoryMode = "dialogue" | "narration" | "hybrid" | "auto";
export type ResolvedStoryMode = "dialogue" | "narration" | "hybrid";

export interface StoryBeat {
  beatNumber: number;
  narration: string;
  voiceRole: string;       // "narrator" or "character_[name]"
  emotion: string;
  visualPrompt: string;
  durationSec: number;
}

/**
 * A named character extracted from the story.
 * referenceImageUrl / referenceGeneratedAt are populated by the
 * /api/generate-character-sheet route, not by Claude.
 */
export interface Character {
  name: string;
  voiceRole: string;           // matches beat voiceRole, e.g. "character_Elena"
  physicalDescription: string; // full visual description for image generation
  lockedTraits: string[];      // 2-3 hard identifying details extracted from physicalDescription
  voiceNotes: string;          // how this character speaks (cadence, vocabulary, register)
  referenceImageUrl: string | null;
  referenceGeneratedAt: string | null;
}

export interface GeneratedStory {
  genre: string;
  tone: string;
  hook: string;
  loopEnding: string;
  beats: StoryBeat[];
  totalWordCount: number;
  resolvedStoryMode: ResolvedStoryMode;
  resolvedGenre: string;
  characters: Character[];     // populated for dialogue/hybrid; empty array for narration
  platformVariants: {
    tiktok30: StoryBeat[];
    shorts55: StoryBeat[];
    reels90: StoryBeat[];
  };
}

export interface StoryRequest {
  genre: string;             // specific genre id OR "auto"
  tone: "dark" | "neutral" | "uplifting";
  targetLength: "30s" | "60s" | "90s" | "3min";
  storyMode: StoryMode;
  seriesMode: boolean;
  episodeNumber?: number;
  seriesContext?: string;
}
