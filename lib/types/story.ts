export type StoryMode = "dialogue" | "narration" | "hybrid" | "auto";
export type ResolvedStoryMode = "dialogue" | "narration" | "hybrid";

export interface StoryBeat {
  beatNumber: number;
  narration: string;
  voiceRole: string;       // e.g. "narrator", "character_1"
  emotion: string;          // e.g. "tense", "hopeful", "dark"
  visualPrompt: string;     // description for image/video generation
  durationSec: number;
}

export interface GeneratedStory {
  genre: string;
  tone: string;
  hook: string;              // first 3 seconds, written as narration
  loopEnding: string;        // final line, written to loop back to hook
  beats: StoryBeat[];
  totalWordCount: number;
  resolvedStoryMode: ResolvedStoryMode;
  resolvedGenre: string;     // the actual genre id used (differs from "auto" when auto was requested)
  platformVariants: {
    tiktok30: StoryBeat[];   // condensed beat set for ~30 sec
    shorts55: StoryBeat[];   // condensed beat set for ~55 sec
    reels90: StoryBeat[];    // condensed beat set for ~90 sec
  };
}

export interface StoryRequest {
  genre: string;             // specific genre id OR "auto"
  tone: "dark" | "neutral" | "uplifting";
  targetLength: "30s" | "60s" | "90s" | "3min";
  storyMode: StoryMode;
  seriesMode: boolean;
  episodeNumber?: number;
  seriesContext?: string;   // summary of prior episodes if seriesMode is true
}
