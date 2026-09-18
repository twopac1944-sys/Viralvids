import { VisualStyle, ResolvedVisualStyle } from "@/lib/types/story";
import { STYLE_MAP, DEFAULT_STYLE } from "@/lib/genres/styleMap";

/**
 * Resolves the requested visual style to a concrete style.
 * Must be called AFTER genre auto-resolution so resolvedGenre is a real id.
 *
 * Explicit styles pass through unchanged — creator choice always wins.
 * "auto" → looks up the genre in STYLE_MAP; applies weighted random for
 *           genres that support multiple styles (e.g. horror 60/40).
 */
export function resolveVisualStyle(
  requestedStyle: VisualStyle,
  resolvedGenre: string
): ResolvedVisualStyle {
  if (requestedStyle !== "auto") return requestedStyle as ResolvedVisualStyle;

  const entry = STYLE_MAP[resolvedGenre] ?? DEFAULT_STYLE;

  if (typeof entry === "string") return entry;

  // Weighted random selection
  const rand = Math.random();
  let cumulative = 0;
  for (const { style, weight } of entry) {
    cumulative += weight;
    if (rand < cumulative) return style;
  }
  return entry[entry.length - 1].style;
}
