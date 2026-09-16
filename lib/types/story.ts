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
  platformVariants: {
    tiktok30: StoryBeat[];   // condensed beat set for ~30 sec
    shorts55: StoryBeat[];   // condensed beat set for ~55 sec
    reels90: StoryBeat[];    // condensed beat set for ~90 sec
  };
}

export interface StoryRequest {
  genre: string;
  tone: "dark" | "neutral" | "uplifting";
  targetLength: "30s" | "60s" | "90s" | "3min";
  seriesMode: boolean;
  episodeNumber?: number;
  seriesContext?: string;   // summary of prior episodes if seriesMode is true
}
