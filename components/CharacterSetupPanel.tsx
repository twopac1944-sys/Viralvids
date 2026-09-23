"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryPackage } from "@/lib/types";

type SheetStatus = "pending" | "generating" | "done" | "error";

export default function CharacterSetupPanel({
  story,
  onStoryUpdated,
}: {
  story: StoryPackage;
  onStoryUpdated: (story: StoryPackage) => void;
}) {
  const [statuses, setStatuses] = useState<Record<string, SheetStatus>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [overrideUploading, setOverrideUploading] = useState<Record<string, boolean>>({});

  // storyRef always holds the latest story so sequential async updates
  // don't overwrite each other (avoids stale-closure race on imageReferenceUrls).
  const storyRef = useRef(story);
  useEffect(() => { storyRef.current = story; }, [story]);

  // Auto-generate character sheets for visual characters when a new story arrives.
  useEffect(() => {
    const visualChars = story.characters.filter(
      (c) => !c.voiceOnly && c.imageReferenceUrls.length === 0
    );
    if (visualChars.length === 0) return;

    let cancelled = false;

    // Mark all as pending immediately so the UI reflects what's queued.
    setStatuses((prev) => {
      const next = { ...prev };
      for (const c of visualChars) next[c.id] = "pending";
      return next;
    });
    setErrors({});

    async function runGeneration() {
      for (const char of visualChars) {
        if (cancelled) break;

        setStatuses((prev) => ({ ...prev, [char.id]: "generating" }));

        try {
          const res = await fetch("/api/character-sheet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ characterId: char.id, appearance: char.appearance }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Character sheet failed");

          if (!cancelled) {
            // Build the updated story on top of the latest version (via ref)
            // so previous characters' URLs aren't lost.
            const updated: StoryPackage = {
              ...storyRef.current,
              characters: storyRef.current.characters.map((c) =>
                c.id === char.id
                  ? { ...c, imageReferenceUrls: [data.imageUrl] }
                  : c
              ),
            };
            onStoryUpdated(updated);
            setStatuses((prev) => ({ ...prev, [char.id]: "done" }));
          }
        } catch (err: any) {
          if (!cancelled) {
            setStatuses((prev) => ({ ...prev, [char.id]: "error" }));
            setErrors((prev) => ({ ...prev, [char.id]: err.message }));
          }
        }
      }
    }

    runGeneration();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.storyId]); // re-run only when a new story is applied

  const visualChars = story.characters.filter((c) => !c.voiceOnly);
  const voiceOnlyChars = story.characters.filter((c) => c.voiceOnly);
  const allDone = visualChars.every(
    (c) => c.imageReferenceUrls.length > 0 || statuses[c.id] === "done"
  );

  return (
    <section className="bg-panel border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">2. Character References</h2>
        {!allDone && visualChars.length > 0 && (
          <span className="text-xs text-yellow-400">Generating sheets…</span>
        )}
        {allDone && visualChars.length > 0 && (
          <span className="text-xs text-green-400">All sheets ready</span>
        )}
      </div>

      {/* Visual characters — auto-generated */}
      {visualChars.map((c) => {
        const status = statuses[c.id] ?? (c.imageReferenceUrls.length > 0 ? "done" : "pending");
        const imageUrl = c.imageReferenceUrls[0];

        return (
          <div key={c.id} className="border border-border rounded p-4 flex gap-4 items-start">
            {/* Thumbnail / status */}
            <div className="flex-shrink-0 w-20 h-24 rounded overflow-hidden bg-bg border border-border flex items-center justify-center">
              {status === "done" && imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={c.name} className="w-full h-full object-cover" />
              ) : status === "generating" ? (
                <span className="text-xs text-yellow-400 text-center px-1">Generating…</span>
              ) : status === "error" ? (
                <span className="text-xs text-red-400 text-center px-1">Error</span>
              ) : (
                <span className="text-xs text-gray-600 text-center px-1">Queued</span>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-1">
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{c.appearance}</p>
              {status === "error" && errors[c.id] && (
                <p className="text-xs text-red-400">{errors[c.id]}</p>
              )}
              {status === "done" && (
                <p className="text-xs text-gray-600">
                  Reference image attached · {c.imageReferenceUrls.length} url
                  {c.imageReferenceUrls.length !== 1 ? "s" : ""}
                </p>
              )}
              <label className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 inline-flex items-center gap-1 mt-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setOverrideUploading((prev) => ({ ...prev, [c.id]: true }));
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("folder", "character-refs");
                      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      const updated: StoryPackage = {
                        ...storyRef.current,
                        characters: storyRef.current.characters.map((ch) =>
                          ch.id === c.id ? { ...ch, imageReferenceUrls: [data.url] } : ch
                        ),
                      };
                      onStoryUpdated(updated);
                      setStatuses((prev) => ({ ...prev, [c.id]: "done" }));
                    } catch (err: any) {
                      setErrors((prev) => ({ ...prev, [c.id]: err.message }));
                    } finally {
                      setOverrideUploading((prev) => ({ ...prev, [c.id]: false }));
                      e.target.value = "";
                    }
                  }}
                />
                {overrideUploading[c.id] ? "Uploading…" : "Replace with your own image"}
              </label>
            </div>
          </div>
        );
      })}

      {/* Voice-only characters — no image needed */}
      {voiceOnlyChars.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Voice only</p>
          {voiceOnlyChars.map((c) => (
            <div key={c.id} className="border border-border rounded px-4 py-3 flex gap-3 items-center">
              <div className="w-8 h-8 rounded bg-bg border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-600">🎙</span>
              </div>
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-gray-600">No visual reference — skipping character sheet</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
