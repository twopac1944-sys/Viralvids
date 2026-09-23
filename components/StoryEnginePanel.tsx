"use client";

import { useState } from "react";
import type { StoryPackage } from "@/lib/types";
import { genres } from "@/lib/genres/genres";

const LENGTH_OPTIONS = [
  { label: "30s",  value: 30  },
  { label: "60s",  value: 60  },
  { label: "90s",  value: 90  },
  { label: "3 min", value: 180 },
];

export default function StoryEnginePanel({
  onStoryGenerated
}: {
  onStoryGenerated: (story: StoryPackage) => void;
}) {
  const [genre, setGenre] = useState("thriller");
  const [tone, setTone] = useState<"dark" | "neutral" | "uplifting">("dark");
  const [targetLengthSeconds, setTargetLengthSeconds] = useState(60);
  const [premise, setPremise] = useState("");
  const [manualOutline, setManualOutline] = useState("");
  const [brandName, setBrandName] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [hookNote, setHookNote] = useState("");
  const [loopEndingNote, setLoopEndingNote] = useState("");
  const [seriesMode, setSeriesMode] = useState(false);
  const [episodeNumber, setEpisodeNumber] = useState(2);
  const [priorEpisodeSummary, setPriorEpisodeSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        genre,
        premise,
        tone,
        targetLengthSeconds,
      };
      if (seriesMode && priorEpisodeSummary.trim()) {
        body.seriesContext = { episodeNumber, priorEpisodeSummary: priorEpisodeSummary.trim() };
      }
      if (manualOutline.trim())   body.manualOutline   = manualOutline.trim();
      if (brandName.trim())       body.brandEmbed      = { brandName: brandName.trim(), ...(logoImageUrl && { logoImageUrl }) };
      if (hookNote.trim())        body.hookNote        = hookNote.trim();
      if (loopEndingNote.trim())  body.loopEndingNote  = loopEndingNote.trim();

      const res = await fetch("/api/story-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Story engine failed");
      setRawJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function confirmAndApply() {
    if (!rawJson) return;
    try {
      const parsed: StoryPackage = JSON.parse(rawJson);
      onStoryGenerated(parsed);
    } catch {
      setError("Edited JSON is invalid — fix syntax before applying.");
    }
  }

  return (
    <section className="bg-panel border border-border rounded-lg p-5 space-y-4">
      <h2 className="text-lg font-medium">1. Story Engine</h2>

      {/* Genre / Tone / Length row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Genre</label>
          <select
            className="w-full bg-white border border-border rounded px-3 py-2 text-sm text-black"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">Tone</label>
          <select
            className="w-full bg-white border border-border rounded px-3 py-2 text-sm text-black"
            value={tone}
            onChange={(e) => setTone(e.target.value as "dark" | "neutral" | "uplifting")}
          >
            <option value="dark">Dark</option>
            <option value="neutral">Neutral</option>
            <option value="uplifting">Uplifting</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-400">Length</label>
          <select
            className="w-full bg-white border border-border rounded px-3 py-2 text-sm text-black"
            value={targetLengthSeconds}
            onChange={(e) => setTargetLengthSeconds(Number(e.target.value))}
          >
            {LENGTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Premise */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">Premise</label>
        <textarea
          className="w-full bg-white border border-border rounded px-3 py-2 text-sm h-20 text-black"
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          placeholder="e.g. A courier makes her final drop for a debt she never agreed to."
        />
      </div>

      {/* Manual Outline */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">
          Manual Outline <span className="text-gray-600">(optional)</span>
        </label>
        <textarea
          className="w-full bg-white border border-border rounded px-3 py-2 text-sm h-28 text-black"
          value={manualOutline}
          onChange={(e) => setManualOutline(e.target.value)}
          placeholder={`Your own story beats — Claude will break them into scenes and add production detail without changing the plot.\n\ne.g. Scene 1: Maya confronts her boss with proof of the fraud. He denies it. Scene 2: She finds the hard drive gone from her desk. Scene 3: She sends the files anyway — then her screen goes black.`}
        />
      </div>

      {/* Brand placement */}
      <div className="space-y-1">
        <label className="text-sm text-gray-400">
          Brand Placement <span className="text-gray-600">(optional)</span>
        </label>
        <input
          className="w-full bg-white border border-border rounded px-3 py-2 text-sm text-black"
          value={brandName}
          onChange={(e) => { setBrandName(e.target.value); if (!e.target.value.trim()) setLogoImageUrl(""); }}
          placeholder="e.g. Acme Coffee — placed as background scenery, no dialogue"
        />
        {brandName.trim() && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 flex items-center gap-1.5">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("folder", "brand-logos");
                    const res = await fetch("/api/upload-image", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setLogoImageUrl(data.url);
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setLogoUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              {logoUploading ? "Uploading…" : logoImageUrl ? "Replace logo" : "Upload logo image (optional)"}
            </label>
            {logoImageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoImageUrl} alt="logo preview" className="h-7 w-auto rounded border border-border object-contain bg-white" />
                <button
                  type="button"
                  onClick={() => setLogoImageUrl("")}
                  className="text-xs text-gray-600 hover:text-red-400"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hook / Loop ending notes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">
            Hook Note <span className="text-gray-600">(optional)</span>
          </label>
          <input
            className="w-full bg-white border border-border rounded px-3 py-2 text-sm text-black"
            value={hookNote}
            onChange={(e) => setHookNote(e.target.value)}
            placeholder="e.g. Open on a specific accusation, not a question"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">
            Loop Ending Note <span className="text-gray-600">(optional)</span>
          </label>
          <input
            className="w-full bg-white border border-border rounded px-3 py-2 text-sm text-black"
            value={loopEndingNote}
            onChange={(e) => setLoopEndingNote(e.target.value)}
            placeholder="e.g. Mirror the opening line exactly, inverted"
          />
        </div>
      </div>

      {/* Series Mode */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={seriesMode}
            onChange={(e) => setSeriesMode(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          Series Mode
        </label>

        {seriesMode && (
          <div className="space-y-3 pl-5 border-l border-border">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Episode Number</label>
              <input
                type="number"
                min={2}
                className="w-20 bg-white border border-border rounded px-3 py-2 text-sm text-black"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Prior Episode Summary</label>
              <textarea
                className="w-full bg-white border border-border rounded px-3 py-2 text-sm h-20 text-black"
                value={priorEpisodeSummary}
                onChange={(e) => setPriorEpisodeSummary(e.target.value)}
                placeholder="Describe what happened in prior episodes..."
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="bg-accent text-black font-medium px-4 py-2 rounded text-sm disabled:opacity-40"
      >
        {loading ? "Generating..." : "Generate Story Package"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {rawJson && (
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Review / edit before rendering — catches bad output before burning H3 credits
          </label>
          <textarea
            className="w-full bg-white border border-border rounded px-3 py-2 text-xs font-mono h-64 text-black"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
          />
          <button
            onClick={confirmAndApply}
            className="bg-white text-black font-medium px-4 py-2 rounded text-sm"
          >
            Apply Story Package
          </button>
        </div>
      )}
    </section>
  );
}
