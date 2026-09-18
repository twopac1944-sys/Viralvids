import { Emotion } from "@/lib/types/story";

export interface ChatterboxParams {
  exaggeration: number;
  cfg: number;
}

export const EMOTION_PARAMS: Record<Emotion, ChatterboxParams> = {
  tense:      { exaggeration: 0.8,  cfg: 0.35 },
  dark:       { exaggeration: 0.7,  cfg: 0.4  },
  hopeful:    { exaggeration: 0.6,  cfg: 0.5  },
  mysterious: { exaggeration: 0.65, cfg: 0.4  },
  urgent:     { exaggeration: 1.0,  cfg: 0.3  },
  calm:       { exaggeration: 0.4,  cfg: 0.6  },
  triumphant: { exaggeration: 1.0,  cfg: 0.4  },
  melancholic:{ exaggeration: 0.5,  cfg: 0.55 },
};

export function paramsForEmotion(emotion: string): ChatterboxParams {
  return EMOTION_PARAMS[emotion as Emotion] ?? { exaggeration: 0.5, cfg: 0.5 };
}
