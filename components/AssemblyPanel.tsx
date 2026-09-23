"use client";

import { useState } from "react";
import type { StoryPackage, RenderResult } from "@/lib/types";

export default function AssemblyPanel({
  story,
  renderResults
}: {
  story: StoryPackage;
  renderResults: Record<number, RenderResult>;
}) {
  const [status, setStatus] = useState<string | null>(null);

  const completedScenes = story.scenes.filter(
    (s) => renderResults[s.sceneId]?.status === "complete"
  );
  const allComplete = completedScenes.length === story.scenes.length && story.scenes.length > 0;

  async function assemble() {
    setStatus("assembling");
    try {
      const res = await fetch("/api/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.storyId,
          sceneVideoUrls: completedScenes.map((s) => renderResults[s.sceneId].videoUrl)
        })
      });
      const data = await res.json();
      setStatus(data.status ?? "done");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <section className="bg-panel border border-border rounded-lg p-5 space-y-3">
      <h2 className="text-lg font-medium">4. Assembly</h2>
      <p className="text-sm text-gray-400">
        {completedScenes.length} / {story.scenes.length} scenes approved
      </p>
      <button
        onClick={assemble}
        disabled={!allComplete}
        className="bg-white text-black text-sm font-medium px-4 py-2 rounded disabled:opacity-40"
      >
        Stitch Final Video
      </button>
      {status && <p className="text-xs text-gray-500">Status: {status}</p>}
    </section>
  );
}
