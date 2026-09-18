"use client";

import { useState } from "react";
import { GeneratedStory } from "@/lib/types/story";
import { VOICE_REGISTRY } from "@/lib/voice/voiceRegistry";

// ── Genre options (dialogue-strong genres for this test) ──────────────────────
const GENRES = [
  { id: "drama",       label: "Drama" },
  { id: "feel-good",   label: "Feel-Good" },
  { id: "romance",     label: "Romance" },
  { id: "young-adult", label: "Young Adult" },
  { id: "mystery",     label: "Mystery" },
  { id: "thriller",    label: "Thriller" },
];

// Map genre → best tone (feel-good needs uplifting, romance neutral, rest dark)
const TONE_FOR_GENRE: Record<string, "dark" | "neutral" | "uplifting"> = {
  "feel-good": "uplifting",
  "romance":   "neutral",
};

// ── Types (mirrors server-side BeatAudioResult, no server imports on client) ──
interface BeatAudio {
  beatNumber: number;
  voiceRole: string;
  voice: string;
  cleanText: string;
  audioBase64: string;
  audioMime: string;
  engine: string;
}

interface FailedBeat {
  beatNumber: number;
  error: string;
}

interface EpisodeResult {
  story: GeneratedStory;
  voiceCast: Record<string, string>; // displayName → voiceLabel
  successBeats: BeatAudio[];
  failedBeats: FailedBeat[];
  concatenatedBase64: string;
  durationSec: number;
}

// ── Auto voice assignment ────────────────────────────────────────────────────
// Collects unique voiceRoles from beats, shuffles VOICE_REGISTRY, assigns one
// distinct Chatterbox voice per role. Returns:
//   assignments: { "narrator": "diana", "Mara": "annie", ... }  (sent to API)
//   cast:        { "narrator": "Diana", "Mara": "Annie", ... }  (for display)
function buildVoiceAssignments(story: GeneratedStory): {
  assignments: Record<string, string>;
  cast: Record<string, string>;
} {
  const roles = [...new Set(story.beats.map((b) => b.voiceRole))];
  const shuffled = [...VOICE_REGISTRY].sort(() => Math.random() - 0.5);
  const assignments: Record<string, string> = {};
  const cast: Record<string, string> = {};

  roles.forEach((role, i) => {
    const displayName =
      role === "narrator" ? "narrator" : role.replace(/^character_/i, "");
    const voice = shuffled[i % shuffled.length];
    assignments[displayName] = voice.id;
    cast[displayName] = voice.label;
  });

  return { assignments, cast };
}

// ── Log line type ─────────────────────────────────────────────────────────────
type LogLine = { ok: boolean; text: string };

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EpisodePage() {
  const [genre, setGenre]           = useState("drama");
  const [running, setRunning]       = useState(false);
  const [log, setLog]               = useState<LogLine[]>([]);
  const [currentStep, setCurrentStep] = useState("");
  const [result, setResult]         = useState<EpisodeResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  function addLog(ok: boolean, text: string) {
    setLog((prev) => [...prev, { ok, text }]);
  }

  async function handleGenerate() {
    setRunning(true);
    setLog([]);
    setResult(null);
    setFatalError(null);

    try {
      // ── Stage 1: Generate story ──────────────────────────────────────────
      const tone = TONE_FOR_GENRE[genre] ?? "dark";
      setCurrentStep("Generating story...");
      const storyRes = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre,
          tone,
          targetLength: "90s",
          storyMode: "dialogue",
          visualStyle: "auto",
          seriesMode: false,
        }),
      });
      if (!storyRes.ok) {
        const e = await storyRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? `Story failed (${storyRes.status})`);
      }
      const story = (await storyRes.json()) as GeneratedStory;
      addLog(
        true,
        `Story generated: ${story.resolvedGenre} · ${story.beats.length} beats · ${story.totalWordCount} words`
      );

      // ── Stage 2: Auto-assign voices ──────────────────────────────────────
      setCurrentStep("Assigning voices...");
      const { assignments, cast } = buildVoiceAssignments(story);
      const castStr = Object.entries(cast)
        .map(([name, voice]) => `${name} → ${voice}`)
        .join(" · ");
      addLog(true, `Cast: ${castStr}`);
      setCurrentStep("");

      // ── Stage 3: Voice direction ─────────────────────────────────────────
      setCurrentStep("Running voice direction...");
      const dirRes = await fetch("/api/generate-direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      });
      if (!dirRes.ok) {
        const e = await dirRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? `Voice direction failed (${dirRes.status})`);
      }
      const directedStory = (await dirRes.json()) as GeneratedStory;
      addLog(true, `Voice direction complete (${directedStory.beats.length} beats tagged)`);

      // ── Stage 4: Synthesize all beats ────────────────────────────────────
      setCurrentStep(`Synthesizing ${directedStory.beats.length} beats...`);
      const synthRes = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: directedStory, voiceAssignments: assignments }),
      });
      if (!synthRes.ok) {
        const e = await synthRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? `Synthesis failed (${synthRes.status})`);
      }
      const synthData = (await synthRes.json()) as {
        audio: BeatAudio[];
        errors: FailedBeat[];
      };
      const successBeats = synthData.audio  ?? [];
      const failedBeats  = synthData.errors ?? [];

      // Log and console-error every failure with beat number for tracing
      failedBeats.forEach((f) => {
        console.error(`[Episode Test] Beat #${f.beatNumber} synthesis failed: ${f.error}`);
        addLog(false, `Beat #${f.beatNumber} synthesis failed: ${f.error.slice(0, 120)}`);
      });
      addLog(
        true,
        `Audio synthesized: ${successBeats.length} / ${directedStory.beats.length} beats`
      );

      if (successBeats.length === 0) {
        throw new Error("All beat synthesis failed — nothing to concatenate");
      }

      // ── Stage 5: Concatenate into one episode file ───────────────────────
      setCurrentStep("Concatenating audio...");
      const concatRes = await fetch("/api/concatenate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beats: successBeats.map((b) => ({
            beatNumber: b.beatNumber,
            audioBase64: b.audioBase64,
            audioMime:   b.audioMime,
          })),
        }),
      });
      if (!concatRes.ok) {
        const e = await concatRes.json().catch(() => ({}));
        throw new Error((e as { error?: string }).error ?? `Concatenation failed (${concatRes.status})`);
      }
      const concatData = (await concatRes.json()) as {
        audioBase64: string;
        audioMime: string;
        durationSec: number;
      };
      addLog(true, `Episode ready — ${concatData.durationSec.toFixed(1)}s`);
      setCurrentStep("");

      setResult({
        story: directedStory,
        voiceCast: cast,
        successBeats,
        failedBeats,
        concatenatedBase64: concatData.audioBase64,
        durationSec: concatData.durationSec,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFatalError(msg);
      addLog(false, `Fatal: ${msg}`);
      setCurrentStep("");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Full Episode Test</h1>
      <p className="text-xs text-gray-500 mb-6">
        Dialogue · 90s · Chatterbox voices · auto voice direction
      </p>

      {/* ── Config ── */}
      <div className="flex gap-3 items-end mb-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            disabled={running}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={running}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-semibold text-white transition-colors"
        >
          {running ? "Running pipeline..." : "Generate Full Episode"}
        </button>
      </div>

      {/* ── Progress log ── */}
      {(log.length > 0 || currentStep) && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 space-y-1.5">
          {log.map((l, i) => (
            <div
              key={i}
              className={`text-xs ${l.ok ? "text-green-400" : "text-red-400"}`}
            >
              {l.ok ? "✓" : "✗"} {l.text}
            </div>
          ))}
          {currentStep && (
            <div className="text-xs text-yellow-400">⟳ {currentStep}</div>
          )}
        </div>
      )}

      {/* ── Fatal error ── */}
      {fatalError && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 text-red-300 text-xs">
          {fatalError}
        </div>
      )}

      {/* ── Episode result ── */}
      {result && (
        <div className="space-y-6">

          {/* Cast */}
          <section>
            <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cast</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
              {Object.entries(result.voiceCast).map(([name, voice]) => (
                <div key={name} className="flex gap-3 text-xs">
                  <span className="text-gray-300 w-28 shrink-0">{name}</span>
                  <span className="text-violet-400">→ {voice}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Audio player */}
          <section>
            <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Episode Audio — {result.durationSec.toFixed(1)}s
              {result.failedBeats.length > 0 && (
                <span className="text-yellow-500 ml-2">
                  ({result.failedBeats.length} beat
                  {result.failedBeats.length > 1 ? "s" : ""} missing from audio)
                </span>
              )}
            </h2>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio
              controls
              src={`data:audio/wav;base64,${result.concatenatedBase64}`}
              className="w-full"
            />
          </section>

          {/* Transcript */}
          <section>
            <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Transcript
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-5">
              {result.story.beats.map((beat) => {
                const failed = result.failedBeats.find(
                  (f) => f.beatNumber === beat.beatNumber
                );
                const displayName =
                  beat.voiceRole === "narrator"
                    ? "narrator"
                    : beat.voiceRole.replace(/^character_/i, "");
                const voiceLabel = result.voiceCast[displayName];

                return (
                  <div
                    key={beat.beatNumber}
                    className={`border-l-2 pl-3 ${
                      failed ? "border-red-700" : "border-gray-700"
                    }`}
                  >
                    {/* Beat meta */}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-1.5">
                      <span className="text-gray-500">#{beat.beatNumber}</span>
                      <span className="text-gray-400">{beat.emotion}</span>
                      <span className="text-blue-400">{displayName}</span>
                      {voiceLabel && (
                        <span className="text-violet-400">{voiceLabel}</span>
                      )}
                      <span className="text-gray-500">{beat.durationSec}s</span>
                      {failed && (
                        <span className="text-red-400 font-bold">
                          [SYNTHESIS FAILED]
                        </span>
                      )}
                    </div>

                    {/* Clean narration */}
                    <p className="text-sm text-gray-100 leading-relaxed">
                      {beat.narration}
                    </p>

                    {/* Tagged narration (direction pass) */}
                    {beat.taggedNarration &&
                      beat.taggedNarration !== beat.narration && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {beat.taggedNarration}
                        </p>
                      )}

                    {/* Failure detail */}
                    {failed && (
                      <p className="text-xs text-red-400 mt-1">
                        ↳ {failed.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
