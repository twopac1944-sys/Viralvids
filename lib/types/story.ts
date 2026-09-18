export type StoryMode = "dialogue" | "narration" | "hybrid" | "auto";
export type ResolvedStoryMode = "dialogue" | "narration" | "hybrid";

export type VisualStyle = "photorealistic" | "stylized-illustration" | "anime" | "auto";
export type ResolvedVisualStyle = "photorealistic" | "stylized-illustration" | "anime";

export interface StoryBeat {
  beatNumber: number;
  narration: string;
  voiceRole: string;
  emotion: string;
  visualPrompt: string;
  durationSec: number;
}

export interface Character {
  name: string;
  voiceRole: string;
  physicalDescription: string;
  lockedTraits: string[];
  voiceNotes: string;
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
  resolvedVisualStyle: ResolvedVisualStyle;
  characters: Character[];
  platformVariants: {
    tiktok30: StoryBeat[];
    shorts55: StoryBeat[];
    reels90: StoryBeat[];
  };
}

export interface StoryRequest {
  genre: string;
  tone: "dark" | "neutral" | "uplifting";
  targetLength: "30s" | "60s" | "90s" | "3min";
  storyMode: StoryMode;
  visualStyle: VisualStyle;  // default: "photorealistic" for explicit choice; "auto" for genre-matched
  seriesMode: boolean;
  episodeNumber?: number;
  seriesContext?: string;
}
