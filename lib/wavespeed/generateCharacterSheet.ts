import { Character } from "@/lib/types/story";
import { generate } from "@/lib/wavespeed/client";

/**
 * Generates an initial character reference sheet portrait using WaveSpeed Flux Dev
 * (text-to-image). The resulting URL can then be used as the input image for
 * WaveSpeed Instant Character (wavespeed-ai/instant-character) when placing this
 * character into specific scene beats — maintaining visual identity consistency.
 *
 * Instant Character is image-guided and requires an existing reference image,
 * which is why Flux Dev is used here for the first-time generation.
 */
export async function generateCharacterSheet(character: Character): Promise<string> {
  const lockedTraitsLine =
    character.lockedTraits.length > 0
      ? `Key identifying features: ${character.lockedTraits.join(", ")}.`
      : "";

  const prompt = [
    "Professional character reference sheet portrait.",
    `Character: ${character.name}.`,
    character.physicalDescription,
    lockedTraitsLine,
    "Clean front-facing view, slight three-quarter turn allowed.",
    "Neutral expression, eyes open, looking toward camera.",
    "Soft even studio lighting. Plain light grey background.",
    "No dramatic pose. No action scene. No props. No background detail.",
    "Character reference sheet style. High quality, photorealistic portrait.",
  ]
    .filter(Boolean)
    .join(" ");

  return generate("wavespeed-ai/flux-dev", {
    prompt,
    width: 768,
    height: 1024,
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
  });
}
