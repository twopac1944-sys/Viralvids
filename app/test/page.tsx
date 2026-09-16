"use client";

import { useState } from "react";
import { StoryRequest, GeneratedStory } from "@/lib/types/story";

const PLACEHOLDER_GENRES = [
  { id: "psychological-horror", label: "Psychological Horror" },
  { id: "dark-romance", label: "Dark Romance" },
  { id: "urban-legend", label: "Urban Legend" },
  { id: "sci-fi-dystopia", label: "Sci-Fi Dystopia" },
  { id: "supernatural-thriller", label: "Supernatural Thriller" },
];

const defaultForm: StoryRequest = {
  genre: "psychological-horror",
  tone: "dark",
  targetLength: "60s",
  seriesMode: false,
};

export default function TestPage() {
  const [form, setForm] = useState<StoryRequest>(defaultForm);
  const [result, setResult] = useState<GeneratedStory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GeneratedStory = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-6 text-white">
        Story Engine — API Test
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4 max-w-lg"
      >
        <div>
          <label className="block text-sm text-gray-400 mb-1">Genre</label>
          <select
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          >
            {PLACEHOLDER_GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Tone</label>
          <select
            value={form.tone}
            onChange={(e) =>
              setForm({ ...form, tone: e.target.value as StoryRequest["tone"] })
            }
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="dark">Dark</option>
            <option value="neutral">Neutral</option>
            <option value="uplifting">Uplifting</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Target Length
          </label>
          <select
            value={form.targetLength}
            onChange={(e) =>
              setForm({
                ...form,
                targetLength: e.target.value as StoryRequest["targetLength"],
              })
            }
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="30s">30 seconds</option>
            <option value="60s">60 seconds</option>
            <option value="90s">90 seconds</option>
            <option value="3min">3 minutes</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="seriesMode"
            checked={form.seriesMode}
            onChange={(e) =>
              setForm({ ...form, seriesMode: e.target.checked })
            }
            className="w-4 h-4 accent-indigo-500"
          />
          <label htmlFor="seriesMode" className="text-sm text-gray-400">
            Series Mode
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded px-4 py-2 font-semibold transition-colors"
        >
          {loading ? "Generating..." : "Generate Story"}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded p-4 mb-6 text-red-300 max-w-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-300">
              Response ({result.beats.length} beats,{" "}
              {result.totalWordCount} words)
            </h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {result.genre} / {result.tone}
            </span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">HOOK</p>
            <p className="text-indigo-300 text-sm">{result.hook}</p>
            <p className="text-xs text-gray-500 mt-3 mb-1">LOOP ENDING</p>
            <p className="text-indigo-300 text-sm">{result.loopEnding}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-3">BEATS</p>
            <div className="space-y-3">
              {result.beats.map((beat) => (
                <div
                  key={beat.beatNumber}
                  className="border-l-2 border-gray-700 pl-3"
                >
                  <div className="flex gap-2 text-xs text-gray-500 mb-1">
                    <span>#{beat.beatNumber}</span>
                    <span className="text-yellow-600">{beat.emotion}</span>
                    <span className="text-blue-500">{beat.voiceRole}</span>
                    <span>{beat.durationSec}s</span>
                  </div>
                  <p className="text-sm text-gray-200 mb-1">{beat.narration}</p>
                  <p className="text-xs text-gray-500 italic">
                    {beat.visualPrompt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">PLATFORM VARIANTS</p>
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
              <div>
                <span className="text-pink-400 font-semibold">TikTok 30s</span>
                <p>{result.platformVariants.tiktok30.length} beats</p>
              </div>
              <div>
                <span className="text-red-400 font-semibold">Shorts 55s</span>
                <p>{result.platformVariants.shorts55.length} beats</p>
              </div>
              <div>
                <span className="text-purple-400 font-semibold">Reels 90s</span>
                <p>{result.platformVariants.reels90.length} beats</p>
              </div>
            </div>
          </div>

          <details className="bg-gray-900 border border-gray-800 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-xs text-gray-500 hover:text-gray-300">
              Raw JSON
            </summary>
            <pre className="p-4 text-xs text-gray-400 overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}
