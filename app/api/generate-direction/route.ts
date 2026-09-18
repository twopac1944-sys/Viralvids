import { NextRequest, NextResponse } from "next/server";
import { GeneratedStory, StoryBeat } from "@/lib/types/story";
import { buildDirectionPrompt } from "@/lib/claude/directionPrompt";
import claudeClient from "@/lib/claude/client";

interface DirectionResult {
  beatNumber: number;
  taggedNarration: string;
}

function isValidResult(r: unknown): r is DirectionResult {
  if (typeof r !== "object" || r === null) return false;
  const x = r as Record<string, unknown>;
  return typeof x.beatNumber === "number" && typeof x.taggedNarration === "string";
}

export async function POST(req: NextRequest) {
  let story: GeneratedStory;
  try {
    story = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(story.beats) || story.beats.length === 0) {
    return NextResponse.json({ error: "Story has no beats" }, { status: 400 });
  }

  const { system, user } = buildDirectionPrompt(story.beats, story.characters ?? []);

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
      return NextResponse.json({ error: "Unexpected Claude response type" }, { status: 500 });
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
      { error: "Failed to parse direction response as JSON", raw: rawContent.slice(0, 500) },
      { status: 500 }
    );
  }

  if (!Array.isArray(parsed) || !parsed.every(isValidResult)) {
    return NextResponse.json(
      { error: "Direction response shape invalid", raw: rawContent.slice(0, 500) },
      { status: 500 }
    );
  }

  // Merge taggedNarration back onto beats by beatNumber
  const tagMap = new Map<number, string>(
    (parsed as DirectionResult[]).map((r) => [r.beatNumber, r.taggedNarration])
  );

  const directedBeats: StoryBeat[] = story.beats.map((beat) => ({
    ...beat,
    taggedNarration: tagMap.get(beat.beatNumber) ?? beat.narration,
  }));

  return NextResponse.json({ ...story, beats: directedBeats });
}
