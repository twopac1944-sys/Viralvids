import { genres } from "@/lib/genres/genres";

/**
 * Resolves the requested genre to a concrete genre id.
 * Explicit genre ids pass through unchanged — user choice always wins.
 * "auto" -> uniformly random from all genres (1-in-N, Feel-Good included).
 */
export function resolveGenre(requestedGenre: string): string {
  if (requestedGenre !== "auto") return requestedGenre;
  return genres[Math.floor(Math.random() * genres.length)].id;
}
