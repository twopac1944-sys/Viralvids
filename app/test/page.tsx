"use client";

import { useState } from "react";
import Image from "next/image";
import {
  StoryRequest,
  GeneratedStory,
  StoryBeat,
  Character,
  StoryMode,
  ResolvedStoryMode,
} from "@/lib/types/story";

const ALL_GENRES = [
  { id: "fantasy", label: "Fantasy" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "mystery", label: "Mystery" },
  { id: "thriller", label: "Thriller" },
  { id: "romance", label: "Romance" },
  { id: "adventure", label: "Adventure" },
  { id: "drama", label: "Drama" },
  { id: "comedy", label: "Comedy" },
  { id: "western", label: "Western" },
  { id: "literary-fiction", label: "Literary Fiction" },
  { id: "young-adult", label: "Young Adult" },
  { id: "historical-fiction", label: "Historical Fiction" },
  { id: "paranormal", label: "Paranormal" },
  { id: "action", label: "Action" },
  { id: "true-crime", label: "True Crime" },
  { id: "horror", label: "Horror" },
  { id: "psychological-thriller", label: "Psychological Thriller" },
  { id: "revenge-karma", label: "Revenge / Karma" },
  { id: "supernatural-folklore", label: "Supernatural / Folklore" },
  { id: "historical-mystery", label: "Historical Mystery" },
  { id: "urban-legend", label: "Urban Legend" },
  { id: "survival", label: "Survival" },
  { id: "forbidden-romance", label: "Forbidden Romance" },
  { id: "sci-fi-serial", label: "Sci-Fi Serial" },
  { id: "motivational-redemption", label: "Motivational / Redemption" },
  { id: "dark-fairy-tale", label: "Dark Fairy Tale" },
  { id: "feel-good", label: "Feel-Good" },
];

const EMOTION_COLORS: Record<string, string> = {
  tense: "text-orange-400",
  dark: "text-red-400",
  hopeful: "text-green-400",
  mysterious: "text-purple-400",
  urgent: "text-yellow-400",
  calm: "text-sky-400",
  triumphant: "text-emerald-400",
  melancholic: "text-blue-400",
};

const MODE_BADGE: Record<
  ResolvedStoryMode,
  { label: string; color: string; bg: string; border: string }
> = {
  dialogue: { label: "Dialogue", color: "text-amber-300", bg: "bg-amber-950", border: "border-amber-800" },
  narration: { label: "Narration", color: "text-sky-300", bg: "bg-sky-950", border: "border-sky-800" },
  hybrid: { label: "Hybrid", color: "text-violet-300", bg: "bg-violet-950", border: "border-violet-800" },
};

const GENRE_LABEL: Record<string, string> = Object.fromEntries(
  ALL_GENRES.map((g) => [g.id, g.label])
);

const defaultForm: StoryRequest = {
  genre: "feel-good",
  tone: "uplifting",
  targetLength: "60s",
  storyMode: "dialogue",
  seriesMode: false,
};

type Tab = "full" | "tiktok30" | "shorts55" | "reels90";

const TAB_META: { id: Tab; label: string; color: string }[] = [
  { id: "full", label: "Full Story", color: "text-white" },
  { id: "tiktok30", label: "TikTok 30s", color: "text-pink-400" },
  { id: "shorts55", label: "Shorts 55s", color: "text-red-400" },
  { id: "reels90", label: "Reels 90s", color: "text-purple-400" },
];

const VARIANT_META = [
  { key: "tiktok30" as const, label: "TikTok 30s", color: "text-pink-400", border: "border-pink-900" },
  { key: "shorts55" as const, label: "Shorts 55s", color: "text-red-400", border: "border-red-900" },
  { key: "reels90" as const, label: "Reels 90s", color: "text-purple-400", border: "border-purple-900" },
];

function MatchBadge({ matches }: { matches: boolean }) {
  return matches ? (
    <span className="text-xs font-medium text-emerald-400 bg-emerald-950 border border-emerald-800 rounded px-1.5 py-0.5">
      ✓ match
    </span>
  ) : (
    <span className="text-xs font-medium text-red-400 bg-red-950 border border-red-800 rounded px-1.5 py-0.5">
      ✗ mismatch
    </span>
  );
}

function VariantIntegrityPanel({
  hook,
  loopEnding,
  variants,
}: {
  hook: string;
  loopEnding: string;
  variants: GeneratedStory["platformVariants"];
}) {
  return (
    <div className="mb-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
        Hook / Loop Ending — Variant Integrity Check
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {VARIANT_META.map(({ key, label, color, border }) => {
          const beats = variants[key];
          const firstNarration = beats[0]?.narration ?? "";
          const lastNarration = beats[beats.length - 1]?.narration ?? "";
          const hookMatches = firstNarration === hook || firstNarration.startsWith(hook);
          const endingMatches = lastNarration === loopEnding || lastNarration.endsWith(loopEnding);
          return (
            <div key={key} className={`bg-gray-900 border ${border} rounded-lg p-3`}>
              <p className={`text-xs font-semibold mb-3 ${color}`}>{label}</p>
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Hook</span>
                  <MatchBadge matches={hookMatches} />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{firstNarration}</p>
              </div>
              <div className="border-t border-gray-800 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Loop Ending</span>
                  <MatchBadge matches={endingMatches} />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{lastNarration}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BeatList({ beats }: { beats: StoryBeat[] }) {
  const totalSec = beats.reduce((s, b) => s + b.durationSec, 0);
  const totalWords = beats.reduce((s, b) => s + b.narration.split(" ").length, 0);
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        {beats.length} beats · {totalWords} words · ~{totalSec}s
      </p>
      <div className="space-y-4">
        {beats.map((beat) => (
          <div key={beat.beatNumber} className="border-l-2 border-gray-700 pl-4">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-1">
              <span className="text-gray-500">#{beat.beatNumber}</span>
              <span className={EMOTION_COLORS[beat.emotion] ?? "text-gray-400"}>{beat.emotion}</span>
              <span className="text-blue-400">{beat.voiceRole}</span>
              <span className="text-gray-500">{beat.durationSec}s</span>
            </div>
            <p className="text-sm text-gray-100 mb-1 leading-relaxed">{beat.narration}</p>
            <p className="text-xs text-gray-500 italic leading-relaxed">{beat.visualPrompt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatioBar({ label, count, total, barColor }: { label: string; count: number; total: number; barColor: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-36 truncate">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-xs text-gray-400 w-20 text-right">{count} ({pct}%)</span>
    </div>
  );
}

function genreColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffff;
  return `hsl(${h % 360}, 65%, 55%)`;
}

// ── Character card ──────────────────────────────────────────────────────────

type CharState = {
  character: Character;
  loading: boolean;
  error: string | null;
};

function CharacterCard({
  charState,
  onGenerate,
}: {
  charState: CharState;
  onGenerate: () => void;
}) {
  const { character, loading, error } = charState;
  const hasImage = !!character.referenceImageUrl;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{character.name}</p>
          <p className="text-xs text-blue-400">{character.voiceRole}</p>
        </div>
        {hasImage ? (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-950 border border-emerald-800 rounded px-2 py-0.5 whitespace-nowrap">
            ✓ Reference locked
          </span>
        ) : (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="text-xs bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white rounded px-3 py-1 whitespace-nowrap transition-colors"
          >
            {loading ? "Generating…" : "Generate Reference Sheet"}
          </button>
        )}
      </div>

      {/* Image or placeholder */}
      {hasImage && character.referenceImageUrl ? (
        <div className="mb-3 relative w-full aspect-[3/4] rounded overflow-hidden">
          <Image
            src={character.referenceImageUrl}
            alt={`Reference sheet for ${character.name}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : loading ? (
        <div className="mb-3 w-full aspect-[3/4] rounded bg-gray-800 flex items-center justify-center">
          <div className="text-xs text-gray-500 text-center px-4">
            <div className="animate-pulse mb-2">◌</div>
            Polling WaveSpeed…
          </div>
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <div className="mb-3 bg-red-950 border border-red-800 rounded p-2 text-xs text-red-300">
          {error}
          <button
            onClick={onGenerate}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Physical description + locked traits */}
      <p className="text-xs text-gray-400 leading-relaxed mb-2">
        {character.physicalDescription}
      </p>
      {character.lockedTraits.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {character.lockedTraits.map((t) => (
            <span
              key={t}
              className="text-xs bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-gray-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-600 italic">{character.voiceNotes}</p>

      {/* Generated at timestamp */}
      {character.referenceGeneratedAt && (
        <p className="text-xs text-gray-600 mt-2">
          Generated {new Date(character.referenceGeneratedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TestPage() {
  const [form, setForm] = useState<StoryRequest>(defaultForm);
  const [result, setResult] = useState<GeneratedStory | null>(null);
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [requestedGenre, setRequestedGenre] = useState<string>("feel-good");
  const [requestedMode, setRequestedMode] = useState<StoryMode>("dialogue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("full");
  const [modeCount, setModeCount] = useState<Record<ResolvedStoryMode, number>>({
    dialogue: 0, narration: 0, hybrid: 0,
  });
  const [genreCount, setGenreCount] = useState<Record<string, number>>({});
  const [autoGenreTotal, setAutoGenreTotal] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setCharStates([]);
    setActiveTab("full");
    const submittedGenre = form.genre;
    const submittedMode = form.storyMode;
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const story = data as GeneratedStory;
      setResult(story);
      setRequestedGenre(submittedGenre);
      setRequestedMode(submittedMode);
      setCharStates(
        story.characters.map((c) => ({ character: c, loading: false, error: null }))
      );
      setModeCount((prev) => ({
        ...prev,
        [story.resolvedStoryMode]: prev[story.resolvedStoryMode] + 1,
      }));
      if (submittedGenre === "auto") {
        setAutoGenreTotal((n) => n + 1);
        setGenreCount((prev) => ({
          ...prev,
          [story.resolvedGenre]: (prev[story.resolvedGenre] ?? 0) + 1,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSheet(index: number) {
    const charState = charStates[index];
    setCharStates((prev) =>
      prev.map((cs, i) => (i === index ? { ...cs, loading: true, error: null } : cs))
    );
    try {
      const res = await fetch("/api/generate-character-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: charState.character }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setCharStates((prev) =>
        prev.map((cs, i) =>
          i === index
            ? { character: data.character as Character, loading: false, error: null }
            : cs
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setCharStates((prev) =>
        prev.map((cs, i) => (i === index ? { ...cs, loading: false, error: msg } : cs))
      );
    }
  }

  const activeBeats =
    result && activeTab !== "full"
      ? result.platformVariants[activeTab]
      : result?.beats ?? [];

  const totalModeGenerated = modeCount.dialogue + modeCount.narration + modeCount.hybrid;
  const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-1 text-white">Story Engine</h1>
      <p className="text-xs text-gray-500 mb-8">claude-sonnet-4-6 · WaveSpeed flux-dev</p>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4 max-w-lg">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Genre</label>
          <select
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="auto">Auto (random from all genres)</option>
            <optgroup label="──────────────">
              {ALL_GENRES.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tone</label>
            <select
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value as StoryRequest["tone"] })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="dark">Dark</option>
              <option value="neutral">Neutral</option>
              <option value="uplifting">Uplifting</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Length</label>
            <select
              value={form.targetLength}
              onChange={(e) => setForm({ ...form, targetLength: e.target.value as StoryRequest["targetLength"] })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="30s">30 seconds</option>
              <option value="60s">60 seconds</option>
              <option value="90s">90 seconds</option>
              <option value="3min">3 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Story Mode</label>
          <select
            value={form.storyMode}
            onChange={(e) => setForm({ ...form, storyMode: e.target.value as StoryMode })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="auto">Auto (75% dialogue / 25% narration)</option>
            <option value="dialogue">Dialogue</option>
            <option value="narration">Narration</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="seriesMode" checked={form.seriesMode}
            onChange={(e) => setForm({ ...form, seriesMode: e.target.checked })}
            className="w-4 h-4 accent-indigo-500" />
          <label htmlFor="seriesMode" className="text-xs text-gray-400">Series Mode</label>
        </div>

        {form.seriesMode && (
          <div className="space-y-3">
            {form.genre === "auto" && (
              <p className="text-xs text-yellow-500 bg-yellow-950 border border-yellow-800 rounded px-3 py-2">
                Series + Auto Genre: pass resolvedGenre from episode 1 for subsequent episodes.
              </p>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Episode Number</label>
              <input type="number" min={1} value={form.episodeNumber ?? ""}
                onChange={(e) => setForm({ ...form, episodeNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Series Context</label>
              <textarea rows={3} value={form.seriesContext ?? ""}
                onChange={(e) => setForm({ ...form, seriesContext: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Describe what happened in prior episodes..." />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded px-4 py-2 font-semibold text-sm transition-colors">
          {loading ? "Generating…" : "Generate Story"}
        </button>
      </form>

      {/* ── Session Trackers ── */}
      {(totalModeGenerated > 0 || autoGenreTotal > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-3xl">
          {totalModeGenerated > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Story Mode Ratio ({totalModeGenerated} generated)
              </p>
              <div className="space-y-2">
                {(["dialogue", "narration", "hybrid"] as ResolvedStoryMode[]).map((mode) => {
                  const barColors = { dialogue: "#92400e", narration: "#0c4a6e", hybrid: "#4c1d95" };
                  return (
                    <RatioBar key={mode} label={MODE_BADGE[mode].label}
                      count={modeCount[mode]} total={totalModeGenerated}
                      barColor={barColors[mode]} />
                  );
                })}
                <p className="text-xs text-gray-600 pt-1">Target: dialogue ~75% · narration ~25%</p>
              </div>
            </div>
          )}
          {autoGenreTotal > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                Auto Genre Distribution ({autoGenreTotal} auto rolls)
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sortedGenres.map(([id, count]) => (
                  <RatioBar key={id} label={GENRE_LABEL[id] ?? id}
                    count={count} total={autoGenreTotal} barColor={genreColor(id)} />
                ))}
              </div>
              <p className="text-xs text-gray-600 pt-2">Target: ~1/27 per genre (~3.7%)</p>
            </div>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded p-4 mb-6 text-red-300 text-sm max-w-lg">
          {error}
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-200">
                {result.beats.length} beats · {result.totalWordCount} words
              </h2>
              {requestedGenre === "auto" && (
                <span className="text-xs font-medium text-lime-300 bg-lime-950 border border-lime-800 rounded px-2 py-0.5">
                  Auto → {GENRE_LABEL[result.resolvedGenre] ?? result.resolvedGenre}
                </span>
              )}
              {(() => {
                const m = MODE_BADGE[result.resolvedStoryMode];
                return (
                  <span className={`text-xs font-medium ${m.color} ${m.bg} border ${m.border} rounded px-2 py-0.5`}>
                    {requestedMode === "auto" ? `Auto → ${m.label}` : m.label}
                  </span>
                );
              })()}
            </div>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {result.genre} / {result.tone}
            </span>
          </div>

          {/* Hook + Loop Ending */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Hook</p>
              <p className="text-indigo-300 text-sm leading-relaxed">{result.hook}</p>
            </div>
            <div className="border-t border-gray-800 pt-3">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Loop Ending</p>
              <p className="text-indigo-300 text-sm leading-relaxed">{result.loopEnding}</p>
            </div>
          </div>

          {/* Characters */}
          {charStates.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Characters — Reference Sheets
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {charStates.map((cs, i) => (
                  <CharacterCard
                    key={cs.character.voiceRole}
                    charState={cs}
                    onGenerate={() => handleGenerateSheet(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Variant integrity */}
          <VariantIntegrityPanel
            hook={result.hook}
            loopEnding={result.loopEnding}
            variants={result.platformVariants}
          />

          {/* Platform tabs */}
          <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-lg p-1">
            {TAB_META.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === t.id ? "bg-gray-700 " + t.color : "text-gray-500 hover:text-gray-300"
                }`}>
                {t.label}
                {t.id !== "full" && (
                  <span className="ml-1 opacity-60">({result.platformVariants[t.id].length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Beats */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <BeatList beats={activeBeats} />
          </div>

          {/* Raw JSON */}
          <details className="bg-gray-900 border border-gray-800 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-xs text-gray-500 hover:text-gray-300">
              Raw JSON
            </summary>
            <pre className="p-4 text-xs text-gray-400 overflow-auto max-h-96 leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}
