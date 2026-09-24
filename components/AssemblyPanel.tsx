"use client";

import { useState, useRef } from "react";
import type { StoryPackage, RenderResult } from "@/lib/types";

export default function AssemblyPanel({
  story,
  renderResults
}: {
  story: StoryPackage;
  renderResults: Record<number, RenderResult>;
}) {
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const completedScenes = story.scenes.filter(
    (s) => renderResults[s.sceneId]?.status === "complete"
  );
  const allComplete = completedScenes.length === story.scenes.length && story.scenes.length > 0;
  const videoUrls = completedScenes
    .map((s) => renderResults[s.sceneId]?.videoUrl)
    .filter(Boolean) as string[];

  function startPlayback() {
    setCurrentIdx(0);
    setPlaying(true);
  }

  function handleEnded() {
    const next = currentIdx + 1;
    if (next < videoUrls.length) {
      setCurrentIdx(next);
      // src change triggers re-render; autoPlay on the element handles play
    } else {
      setPlaying(false);
      setCurrentIdx(0);
    }
  }

  async function downloadScene(url: string, index: number) {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${story.title ?? "scene"}-scene-${index + 1}.mp4`;
    a.click();
  }

  return (
    <section className="bg-panel border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">4. Assembly</h2>
        <span className="text-xs text-gray-400">
          {completedScenes.length} / {story.scenes.length} scenes complete
        </span>
      </div>

      {/* Sequential preview player */}
      {playing && videoUrls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Scene {currentIdx + 1} of {videoUrls.length}</span>
            <button onClick={() => setPlaying(false)} className="text-gray-500 hover:text-white">
              Stop
            </button>
          </div>
          <video
            ref={videoRef}
            key={videoUrls[currentIdx]}
            src={videoUrls[currentIdx]}
            autoPlay
            controls
            onEnded={handleEnded}
            className="w-full rounded"
          />
          {/* Progress dots */}
          <div className="flex gap-1.5 justify-center">
            {videoUrls.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === currentIdx ? "bg-accent" : i < currentIdx ? "bg-green-600" : "bg-gray-600"}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={startPlayback}
          disabled={completedScenes.length === 0}
          className="bg-accent text-black text-sm font-medium px-4 py-2 rounded disabled:opacity-40"
        >
          {playing ? "Restart Preview" : "Preview All Scenes"}
        </button>

        {allComplete && (
          <button
            onClick={() => videoUrls.forEach((url, i) => downloadScene(url, i))}
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded"
          >
            Download All Scenes
          </button>
        )}
      </div>

      {/* Per-scene download list */}
      {completedScenes.length > 0 && (
        <div className="space-y-1">
          {completedScenes.map((scene, i) => {
            const url = renderResults[scene.sceneId]?.videoUrl;
            if (!url) return null;
            return (
              <div key={scene.sceneId} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Scene {scene.sceneId} — {scene.setting}</span>
                <button
                  onClick={() => downloadScene(url, i)}
                  className="text-accent hover:underline"
                >
                  Download
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!allComplete && completedScenes.length < story.scenes.length && (
        <p className="text-xs text-yellow-400">
          Waiting for {story.scenes.length - completedScenes.length} more scene{story.scenes.length - completedScenes.length !== 1 ? "s" : ""} to finish rendering…
        </p>
      )}
    </section>
  );
}
