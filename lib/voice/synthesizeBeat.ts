// Routing layer: Chatterbox (if voice assigned) → Grok fallback
// Called by /api/generate-audio with per-request voiceAssignments.

import { StoryBeat } from "@/lib/types/story";
import { getVoice } from "@/lib/voice/voiceRegistry";
import { synthesizeChatterbox } from "@/lib/voice/chatterbox";
import { paramsForEmotion } from "@/lib/voice/emotionParams";
import { synthesizeBeat as synthesizeGrok, stripDirectionTags, voiceForRole } from "@/lib/voice/tts";

export interface BeatAudioResult {
  beatNumber: number;
  voiceRole: string;
  voice: string;          // voice id or Grok voice name
  cleanText: string;
  audioBase64: string;
  audioMime: string;      // "audio/mp3" | "audio/wav"
  engine: "grok" | "chatterbox";
  /** Publicly accessible CDN URL for the audio file. Only set for Chatterbox; used as lipsync source. */
  audioUrl?: string;
  exaggeration?: number;
  cfg?: number;
}

function characterNameFromRole(voiceRole: string): string {
  // "character_Mara" → "Mara", "narrator" → "narrator"
  return voiceRole.replace(/^character_/i, "");
}

export async function routeBeat(
  beat: StoryBeat,
  narration: string,
  voiceAssignments: Record<string, string>
): Promise<BeatAudioResult> {
  const characterName = characterNameFromRole(beat.voiceRole);
  const assignedVoiceId = voiceAssignments[characterName] ?? voiceAssignments[beat.voiceRole];

  if (assignedVoiceId) {
    const entry = getVoice(assignedVoiceId);
    if (entry) {
      const params = paramsForEmotion(beat.emotion);
      const cleanText = stripDirectionTags(narration);
      const result = await synthesizeChatterbox(
        cleanText,
        entry.referenceAudioUrl,
        params.exaggeration,
        params.cfg
      );
      return {
        beatNumber: beat.beatNumber,
        voiceRole: beat.voiceRole,
        voice: entry.label,
        cleanText,
        audioBase64: result.audioBase64,
        audioMime: result.audioMime,
        audioUrl: result.audioUrl,
        engine: "chatterbox",
        exaggeration: params.exaggeration,
        cfg: params.cfg,
      };
    }
  }

  // Grok fallback
  const grokResult = await synthesizeGrok(beat.beatNumber, narration, beat.voiceRole);
  return {
    beatNumber: grokResult.beatNumber,
    voiceRole: grokResult.voiceRole,
    voice: grokResult.voice,
    cleanText: grokResult.cleanText,
    audioBase64: grokResult.audioBase64,
    audioMime: "audio/mp3",
    engine: "grok",
  };
}
