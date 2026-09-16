import { NextRequest, NextResponse } from "next/server";
import { StoryRequest, GeneratedStory, StoryBeat } from "@/lib/types/story";

const mockBeats: StoryBeat[] = [
  {
    beatNumber: 1,
    narration:
      "She found the letter buried under thirty years of silence — and her hands began to shake.",
    voiceRole: "narrator",
    emotion: "tense",
    visualPrompt:
      "Close-up of trembling hands holding a yellowed envelope, dim attic light, dust motes floating, shallow depth of field",
    durationSec: 5,
  },
  {
    beatNumber: 2,
    narration:
      "The handwriting was her mother's. But her mother had been dead since she was four.",
    voiceRole: "narrator",
    emotion: "dark",
    visualPrompt:
      "Extreme close-up of faded ink handwriting on aged paper, soft focus background of dusty boxes and cobwebs",
    durationSec: 5,
  },
  {
    beatNumber: 3,
    narration: "\"If you're reading this,\" it began, \"then I didn't make it back in time.\"",
    voiceRole: "character_1",
    emotion: "haunted",
    visualPrompt:
      "Medium shot of woman in dim attic, face partially lit by a single hanging bulb, expression of disbelief",
    durationSec: 5,
  },
  {
    beatNumber: 4,
    narration:
      "She turned the envelope over. The postmark read: three days ago.",
    voiceRole: "narrator",
    emotion: "dark",
    visualPrompt:
      "Tight shot on postmark stamp, ink slightly smeared, modern date visible — cut to woman's wide eyes",
    durationSec: 5,
  },
  {
    beatNumber: 5,
    narration:
      "Downstairs, the front door opened. And someone called her name.",
    voiceRole: "narrator",
    emotion: "tense",
    visualPrompt:
      "Low angle shot looking up attic stairs toward a sliver of hallway light, a shadow passes across the floor below",
    durationSec: 5,
  },
  {
    beatNumber: 6,
    narration:
      "The voice was exactly as she'd heard it only in dreams — and in every nightmare since childhood.",
    voiceRole: "narrator",
    emotion: "dark",
    visualPrompt:
      "Woman frozen at the top of the attic stairs, letter clutched to her chest, staircase descending into shadow",
    durationSec: 6,
  },
  {
    beatNumber: 7,
    narration:
      "She took one step down. The letter still warm, as if someone had just sealed it.",
    voiceRole: "narrator",
    emotion: "tense",
    visualPrompt:
      "Slow motion foot on creaking stair, warm glow from below, shadows climbing the wall",
    durationSec: 5,
  },
  {
    beatNumber: 8,
    narration:
      "Whatever was waiting had been patient for thirty years. And now — so was she.",
    voiceRole: "narrator",
    emotion: "dark",
    visualPrompt:
      "Final wide shot: silhouette of woman descending stairs into a pool of warm light, letter still in hand — freeze frame",
    durationSec: 6,
  },
];

const tiktok30Beats: StoryBeat[] = [mockBeats[0], mockBeats[1], mockBeats[3], mockBeats[4], mockBeats[7]];
const shorts55Beats: StoryBeat[] = [mockBeats[0], mockBeats[1], mockBeats[2], mockBeats[3], mockBeats[4], mockBeats[6], mockBeats[7]];
const reels90Beats: StoryBeat[] = mockBeats;

const mockStory: GeneratedStory = {
  genre: "psychological-horror",
  tone: "dark",
  hook: "She found the letter buried under thirty years of silence — and her hands began to shake.",
  loopEnding:
    "Whatever was waiting had been patient for thirty years. And now — so was she.",
  beats: mockBeats,
  totalWordCount: mockBeats.reduce(
    (acc, b) => acc + b.narration.split(" ").length,
    0
  ),
  platformVariants: {
    tiktok30: tiktok30Beats,
    shorts55: shorts55Beats,
    reels90: reels90Beats,
  },
};

export async function POST(req: NextRequest) {
  const body: StoryRequest = await req.json();

  // Stub: ignore body for now, return mock matching the schema
  const story: GeneratedStory = {
    ...mockStory,
    genre: body.genre || mockStory.genre,
    tone: body.tone || mockStory.tone,
  };

  return NextResponse.json(story);
}
