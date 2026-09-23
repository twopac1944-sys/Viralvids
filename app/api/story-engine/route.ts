import { NextRequest, NextResponse } from "next/server";
import type { StoryPackage, SceneJob, DialogueLine } from "@/lib/types";
import claudeClient from "@/lib/claude/client";
import { buildSceneStoryPrompt } from "@/lib/claude/sceneStoryPrompt";

const VALID_TONES = new Set(["dark", "neutral", "uplifting"]);
const VALID_LENGTHS = new Set([30, 60, 90, 180]);

function isValidDialogueLine(d: unknown): d is DialogueLine {
  if (typeof d !== "object" || d === null) return false;
  const dl = d as Record<string, unknown>;
  return (
    typeof dl.characterId === "string" &&
    typeof dl.line === "string" &&
    typeof dl.delivery === "string"
  );
}

function isValidScene(s: unknown): boolean {
  if (typeof s !== "object" || s === null) return false;
  const scene = s as Record<string, unknown>;
  const cam = scene.camera as Record<string, unknown> | null;
  return (
    typeof scene.sceneId === "number" &&
    typeof scene.setting === "string" &&
    typeof scene.sceneDescription === "string" &&
    typeof cam === "object" && cam !== null &&
    typeof cam.angle === "string" &&
    typeof cam.movement === "string" &&
    typeof scene.colorGrade === "string" &&
    Array.isArray(scene.dialogue) &&
    (scene.dialogue as unknown[]).every(isValidDialogueLine) &&
    Array.isArray(scene.soundFx) &&
    typeof scene.musicCue === "string"
  );
}

function isValidCharacter(c: unknown): boolean {
  if (typeof c !== "object" || c === null) return false;
  const ch = c as Record<string, unknown>;
  return (
    typeof ch.id === "string" &&
    typeof ch.name === "string" &&
    typeof ch.appearance === "string" &&
    typeof ch.personalityNote === "string"
  );
}

function isValidStoryShape(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const s = data as Record<string, unknown>;
  return (
    typeof s.title === "string" &&
    Array.isArray(s.characters) &&
    (s.characters as unknown[]).every(isValidCharacter) &&
    Array.isArray(s.scenes) &&
    (s.scenes as unknown[]).length > 0 &&
    (s.scenes as unknown[]).every(isValidScene)
  );
}

export async function POST(req: NextRequest) {
  let body: {
    genre: string;
    premise?: string;
    tone: string;
    targetLengthSeconds: number;
    seriesContext?: { episodeNumber: number; priorEpisodeSummary: string };
    hookNote?: string;
    loopEndingNote?: string;
    manualOutline?: string;
    brandEmbed?: { brandName: string; logoImageUrl?: string };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { genre, premise, tone, targetLengthSeconds, seriesContext, hookNote, loopEndingNote, manualOutline, brandEmbed } = body;

  if (!genre) {
    return NextResponse.json({ error: "genre is required" }, { status: 400 });
  }
  if (!VALID_TONES.has(tone)) {
    return NextResponse.json({ error: `Invalid tone: ${tone}` }, { status: 400 });
  }
  if (!VALID_LENGTHS.has(targetLengthSeconds)) {
    return NextResponse.json({ error: `Invalid targetLengthSeconds: ${targetLengthSeconds}` }, { status: 400 });
  }

  const { system, user } = buildSceneStoryPrompt({
    genre,
    premise,
    tone: tone as "dark" | "neutral" | "uplifting",
    targetLengthSeconds: targetLengthSeconds as 30 | 60 | 90 | 180,
    seriesContext,
    hookNote,
    loopEndingNote,
    manualOutline,
    brandEmbed,
  });

  let rawContent = "";
  try {
    const response = await claudeClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content[0];
    if (block.type !== "text") {
      return NextResponse.json({ error: "Unexpected response type from Claude" }, { status: 500 });
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
      { error: "Failed to parse Claude response as JSON", raw: rawContent.slice(0, 500) },
      { status: 500 }
    );
  }

  if (!isValidStoryShape(parsed)) {
    return NextResponse.json(
      { error: "Claude response does not match StoryPackage shape", raw: rawContent.slice(0, 500) },
      { status: 500 }
    );
  }

  const p = parsed as Record<string, unknown>;

  const storyPackage: StoryPackage = {
    storyId: crypto.randomUUID(),
    title: p.title as string,
    genre,
    premise: premise ?? "",
    tone: tone as "dark" | "neutral" | "uplifting",
    targetLengthSeconds: targetLengthSeconds as 30 | 60 | 90 | 180,
    ...(seriesContext && { seriesContext }),
    ...(hookNote?.trim() && { hookNote: hookNote.trim() }),
    ...(loopEndingNote?.trim() && { loopEndingNote: loopEndingNote.trim() }),
    ...(manualOutline?.trim() && { manualOutline: manualOutline.trim() }),
    ...(brandEmbed?.brandName?.trim() && { brandEmbed: { brandName: brandEmbed.brandName.trim(), ...(brandEmbed.logoImageUrl && { logoImageUrl: brandEmbed.logoImageUrl }) } }),
    characters: (p.characters as Record<string, unknown>[]).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      appearance: c.appearance as string,
      personalityNote: c.personalityNote as string,
      voiceOnly: c.voiceOnly === true,
      imageReferenceUrls: [],
      voiceReferenceUrl: undefined,
    })),
    scenes: p.scenes as SceneJob[],
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(storyPackage);
}
