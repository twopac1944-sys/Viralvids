import { NextRequest, NextResponse } from "next/server";
import { Character, ResolvedVisualStyle } from "@/lib/types/story";
import { generateCharacterSheet } from "@/lib/wavespeed/generateCharacterSheet";

export async function POST(req: NextRequest) {
  let body: { character: Character; visualStyle?: ResolvedVisualStyle };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { character, visualStyle = "photorealistic" } = body;
  if (
    !character ||
    typeof character.name !== "string" ||
    typeof character.physicalDescription !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid character object" },
      { status: 400 }
    );
  }

  if (!process.env.WAVESPEED_API_KEY) {
    return NextResponse.json(
      { error: "WAVESPEED_API_KEY is not configured on the server" },
      { status: 503 }
    );
  }

  let imageUrl: string;
  try {
    imageUrl = await generateCharacterSheet(character, visualStyle);
  } catch (err) {
    const message = err instanceof Error ? err.message : "WaveSpeed generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const updatedCharacter: Character = {
    ...character,
    referenceImageUrl: imageUrl,
    referenceGeneratedAt: new Date().toISOString(),
  };

  return NextResponse.json({ character: updatedCharacter });
}
