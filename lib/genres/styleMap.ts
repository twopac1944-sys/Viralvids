import { ResolvedVisualStyle } from "@/lib/types/story";

export interface WeightedStyle {
  style: ResolvedVisualStyle;
  weight: number; // 0-1, weights must sum to 1.0
}

export type StyleEntry = ResolvedVisualStyle | WeightedStyle[];

/**
 * Genre id -> preferred visual style(s) for auto resolution.
 * Single string = deterministic. Array = weighted random.
 * Genres not listed fall back to DEFAULT_STYLE.
 */
export const STYLE_MAP: Record<string, StyleEntry> = {
  // ── Documentary-leaning → photorealistic ─────────────────────────────────
  "true-crime":             "photorealistic",
  "psychological-thriller": "photorealistic",
  "mystery":                "photorealistic",
  "historical-mystery":     "photorealistic",

  // ── Grounded human drama → photorealistic ────────────────────────────────
  "romance":           "photorealistic",
  "forbidden-romance": "photorealistic",
  "feel-good":         "photorealistic",
  "drama":             "photorealistic",
  "thriller":          "photorealistic",
  "western":           "photorealistic",
  "survival":          "photorealistic",
  "historical-fiction":"photorealistic",
  "literary-fiction":  "photorealistic",
  "young-adult":       "photorealistic",

  // ── Genre supports both → 60 / 40 photorealistic / stylized-illustration ─
  "horror": [
    { style: "photorealistic",       weight: 0.6 },
    { style: "stylized-illustration",weight: 0.4 },
  ],
  "paranormal": [
    { style: "photorealistic",       weight: 0.6 },
    { style: "stylized-illustration",weight: 0.4 },
  ],
  "supernatural-folklore": [
    { style: "photorealistic",       weight: 0.6 },
    { style: "stylized-illustration",weight: 0.4 },
  ],
  "urban-legend": [
    { style: "photorealistic",       weight: 0.6 },
    { style: "stylized-illustration",weight: 0.4 },
  ],
  "dark-fairy-tale": [
    { style: "photorealistic",       weight: 0.6 },
    { style: "stylized-illustration",weight: 0.4 },
  ],

  // ── World-building / imaginative → stylized-illustration ─────────────────
  "fantasy":           "stylized-illustration",
  "sci-fi":            "stylized-illustration",
  "sci-fi-serial":     "stylized-illustration",
  "adventure":         "stylized-illustration",
};

export const DEFAULT_STYLE: ResolvedVisualStyle = "photorealistic";
