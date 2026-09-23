"use client";

import { useState } from "react";
import type { StoryPackage, RenderResult } from "@/lib/types";

export default function ScenePanel({
  story,
  renderResults,
  onRenderResult
}: {
  story: StoryPackage;
  renderResults: Record<number, RenderResult>;
  onRenderResult: (sceneId: number, result: RenderResult) => void;
}) {
  const [voiceRefToggle, setVoiceRefToggle] = useState<Record<number, boolean>>({});
  const [renderingIds, setRenderingIds] = useState<Set<number>>(new Set());

  // Block rendering until all visual characters have a reference image.
  const sheetsReady = story.characters
    .filter((c) => !c.voiceOnly)
    .every((c) => c.imageReferenceUrls.length > 0);

  async function renderScene(sceneId: number) {
    const scene = story.scenes.find((s) => s.sceneId === sceneId);
    if (!scene) return;

    setRenderingIds((prev) => new Set(prev).add(sceneId));
    try {
      const res = await fetch("/api/render-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: { ...scene, useVoiceReference: voiceRefToggle[sceneId] ?? false },
          characters: story.characters,
          ...(story.brandEmbed && { brandEmbed: story.brandEmbed }),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onRenderResult(sceneId, {
        sceneId,
        status: "rendering",
        usedVoiceReference: voiceRefToggle[sceneId] ?? false
      });
    } catch (err: any) {
      onRenderResult(sceneId, {
        sceneId,
        status: "failed",
        errorMessage: err.message,
        usedVoiceReference: voiceRefToggle[sceneId] ?? false
      });
    } finally {
      setRenderingIds((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  }

  const hasAnyVoiceRef = story.characters.some((c) => c.voiceReferenceUrl);

  return (
    <section className="bg-panel border border-border rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">3. Scene Rendering (H3)</h2>
        {!sheetsReady && (
          <span className="text-xs text-yellow-400">Waiting for character sheets…</span>
        )}
      </div>

      {story.scenes.map((scene) => {
        const result = renderResults[scene.sceneId];
        const isRendering = renderingIds.has(scene.sceneId);

        return (
          <div key={scene.sceneId} className="border border-border rounded p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Scene {scene.sceneId}</p>
                <p className="text-xs text-gray-500">{scene.setting}</p>
              </div>
              {result && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    result.status === "complete"
                      ? "bg-green-900 text-green-300"
                      : result.status === "failed"
                      ? "bg-red-900 text-red-300"
                      : "bg-yellow-900 text-yellow-300"
                  }`}
                >
                  {result.status}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-300">{scene.sceneDescription}</p>

            {hasAnyVoiceRef && (
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={voiceRefToggle[scene.sceneId] ?? false}
                  onChange={(e) =>
                    setVoiceRefToggle((prev) => ({ ...prev, [scene.sceneId]: e.target.checked }))
                  }
                />
                Use voice reference clip (A/B test against no-reference generation)
              </label>
            )}

            <button
              onClick={() => renderScene(scene.sceneId)}
              disabled={isRendering || !sheetsReady}
              className="bg-accent text-black text-sm font-medium px-3 py-1.5 rounded disabled:opacity-40"
            >
              {isRendering ? "Rendering..." : "Generate Scene"}
            </button>

            {result?.videoUrl && (
              <video controls className="w-full rounded mt-2" src={result.videoUrl} />
            )}
            {result?.errorMessage && (
              <p className="text-red-400 text-xs">{result.errorMessage}</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
