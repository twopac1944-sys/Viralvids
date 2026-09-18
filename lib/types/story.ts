export type StoryMode = "dialogue" | "narration" | "hybrid" | "auto" | "scripted";
export type ResolvedStoryMode = "dialogue" | "narration" | "hybrid" | "scripted";

export type VisualStyle = "photorealistic" | "stylized-illustration" | "anime" | "auto";
export type ResolvedVisualStyle = "photorealistic" | "stylized-illustration" | "anime";

export type Emotion = "tense" | "dark" | "hopeful" | "mysterious" | "urgent" | "calm" | "triumphant" | "melancholic";

export type BeatType = "dialogue" | "broll";

export interface StoryBeat {
  beatNumber: number;
  narration: string;
  taggedNarration?: string;  // populated by /api/generate-direction; narration stays clean source of truth
  voiceRole: string;
  emotion: string;
  visualPrompt: string;
  durationSec: number;
  beatType?: BeatType;       // "dialogue" (has voice) or "broll" (wordless cutaway); scripted mode only
  soundDesign?: string;      // ambient + diegetic audio description for this beat
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
  musicDirection?: string;  // story-level score description; set by scripted mode
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
  visualStyle: VisualStyle;
  seriesMode: boolean;
  episodeNumber?: number;
  seriesContext?: string;
}
