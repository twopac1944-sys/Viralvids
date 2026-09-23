"use client";

import { useState } from "react";
import type { StoryPackage, RenderResult } from "@/lib/types";
import StoryEnginePanel from "@/components/StoryEnginePanel";
import CharacterSetupPanel from "@/components/CharacterSetupPanel";
import ScenePanel from "@/components/ScenePanel";
import AssemblyPanel from "@/components/AssemblyPanel";

export default function Home() {
  const [story, setStory] = useState<StoryPackage | null>(null);
  const [renderResults, setRenderResults] = useState<Record<number, RenderResult>>({});

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-accent">ViralVid Fast</h1>
        <p className="text-sm text-gray-400 mt-1">
          Pipeline test harness — Story Engine → character references → H3 render → assembly
        </p>
      </header>

      <StoryEnginePanel onStoryGenerated={setStory} />

      {story && (
        <CharacterSetupPanel
          story={story}
          onStoryUpdated={setStory}
        />
      )}

      {story && (
        <ScenePanel
          story={story}
          renderResults={renderResults}
          onRenderResult={(sceneId, result) =>
            setRenderResults((prev) => ({ ...prev, [sceneId]: result }))
          }
        />
      )}

      {story && (
        <AssemblyPanel story={story} renderResults={renderResults} />
      )}
    </main>
  );
}
