import { Character, ResolvedVisualStyle } from "@/lib/types/story";
import { generate } from "@/lib/wavespeed/client";

function buildStyleLock(visualStyle: ResolvedVisualStyle): { prefix: string; suffix: string } {
  switch (visualStyle) {
    case "photorealistic":
      return {
        prefix:
          "Photorealistic portrait photography. Shot on a professional DSLR camera, 85mm lens, natural skin texture with visible pores and imperfections, realistic lighting and shadow falloff, genuine photographic detail. This is NOT illustrated, NOT a 3D render, NOT concept art, NOT anime, NOT stylized or cartoon in any way — authentic photographic realism only.",
        suffix: "Studio headshot photography style. Clean, professional, photojournalistic quality.",
      };
    case "stylized-illustration":
      return {
        prefix:
          "Stylized digital illustration. Bold clean linework, expressive flat or semi-flat color fills, editorial character design style. This is NOT photorealistic, NOT a photograph, NOT anime — clean modern illustrated character art.",
        suffix: "Editorial character illustration. Clean studio reference portrait.",
      };
    case "anime":
      return {
        prefix:
          "Anime character illustration. Japanese animation style, large expressive eyes, clean linework, cel-shaded coloring, crisp high-quality anime production art. This is NOT photorealistic, NOT a photograph, NOT generic 3D render — authentic anime visual style only.",
        suffix: "High-quality anime production art. Clean studio reference portrait.",
      };
  }
}

/**
 * Generates a character reference portrait using WaveSpeed Flux Dev (text-to-image).
 * Style is locked by visualStyle to prevent model drift toward cartoon/illustrated output.
 * The resulting URL is used as the identity anchor for PixVerse C1 reference-to-video.
 */
export async function generateCharacterSheet(
  character: Character,
  visualStyle: ResolvedVisualStyle
): Promise<string> {
  const lockedTraitsLine =
    character.lockedTraits.length > 0
      ? `Key identifying features: ${character.lockedTraits.join(", ")}.`
      : "";

  const { prefix, suffix } = buildStyleLock(visualStyle);

  const prompt = [
    prefix,
    `Character: ${character.name}.`,
    character.physicalDescription,
    lockedTraitsLine,
    "Clean front-facing view, slight three-quarter turn allowed.",
    "Neutral expression, eyes open, looking toward camera.",
    "Soft even studio lighting. Plain light grey background.",
    "No dramatic pose. No action scene. No props. No background detail.",
    suffix,
  ]
    .filter(Boolean)
    .join(" ");

  return generate("wavespeed-ai/flux-dev", {
    prompt,
    width: 768,
    height: 1024,
    num_inference_steps: 35,
    guidance_scale: 7.5,
    num_images: 1,
  });
}
