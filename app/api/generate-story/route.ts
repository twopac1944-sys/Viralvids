import { NextRequest, NextResponse } from "next/server";
import { StoryRequest, GeneratedStory, StoryBeat, ResolvedStoryMode } from "@/lib/types/story";
import { getGenre } from "@/lib/genres/genres";
import { buildStoryPrompt } from "@/lib/claude/storyPrompts";
import claudeClient from "@/lib/claude/client";

const VALID_STORY_MODES = new Set(["dialogue", "narration", "hybrid", "auto"]);
const VALID_RESOLVED_MODES = new Set<ResolvedStoryMode>(["dialogue", "narration", "hybrid"]);

function isValidBeat(b: unknown): b is StoryBeat {
  if (typeof b !== "object" || b === null) return false;
  const beat = b as Record<string, unknown>;
  return (
    typeof beat.beatNumber === "number" &&
    typeof beat.narration === "string" &&
    typeof beat.voiceRole === "string" &&
    typeof beat.emotion === "string" &&
    typeof beat.visualPrompt === "string" &&
    typeof beat.durationSec === "number"
  );
}

function isValidStory(data: unknown): data is GeneratedStory {
  if (typeof data !== "object" || data === null) return false;
  const s = data as Record<string, unknown>;
  return (
    typeof s.genre === "string" &&
    typeof s.tone === "string" &&
    typeof s.hook === "string" &&
    typeof s.loopEnding === "string" &&
    typeof s.totalWordCount === "number" &&
    VALID_RESOLVED_MODES.has(s.resolvedStoryMode as ResolvedStoryMode) &&
    Array.isArray(s.beats) &&
    s.beats.every(isValidBeat) &&
    typeof s.platformVariants === "object" &&
    s.platformVariants !== null &&
    Array.isArray((s.platformVariants as Record<string, unknown>).tiktok30) &&
    Array.isArray((s.platformVariants as Record<string, unknown>).shorts55) &&
    Array.isArray((s.platformVariants as Record<string, unknown>).reels90)
  );
}

export async function POST(req: NextRequest) {
  let body: StoryRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.genre || !body.tone || !body.targetLength) {
    return NextResponse.json(
      { error: "Missing required fields: genre, tone, targetLength" },
      { status: 400 }
    );
  }

  const storyMode = body.storyMode ?? "auto";
  if (!VALID_STORY_MODES.has(storyMode)) {
    return NextResponse.json(
      { error: `Invalid storyMode: ${storyMode}` },
      { status: 400 }
    );
  }

  const genre = getGenre(body.genre);
  if (!genre) {
    return NextResponse.json(
      { error: `Unknown genre: ${body.genre}` },
      { status: 400 }
    );
  }

  const { system, user, resolvedStoryMode } = buildStoryPrompt(
    { ...body, storyMode },
    genre
  );

  let rawContent: string;
  try {
    const response = await claudeClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response type from Claude" },
        { status: 500 }
      );
    }
    rawContent = block.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let parsed: unknown;
  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse Claude response as JSON",
        raw: rawContent.slice(0, 500),
      },
      { status: 500 }
    );
  }

  // Inject resolvedStoryMode server-side — Claude does not produce this field
  const withMode = { ...(parsed as object), resolvedStoryMode };

  if (!isValidStory(withMode)) {
    return NextResponse.json(
      {
        error: "Claude response does not match GeneratedStory shape",
        raw: rawContent.slice(0, 500),
      },
      { status: 500 }
    );
  }

  return NextResponse.json(withMode);
}
