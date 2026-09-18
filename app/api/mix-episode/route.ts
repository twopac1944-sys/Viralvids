import { NextRequest, NextResponse } from "next/server";
import { spawnSync } from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { parseWAV, buildWAV, createSilencePCM, wavDurationSec } from "@/lib/audio/wavUtils";

interface DialogueBeat {
  beatNumber: number;
  audioBase64: string;   // WAV
  audioMime: string;
  beatType?: "dialogue" | "broll";
  durationSec: number;
}

interface SfxBeat {
  beatNumber: number;
  audioBase64: string;   // MP3
  audioMime: string;
}

interface MixRequestBody {
  dialogueBeats: DialogueBeat[];
  sfxBeats?: SfxBeat[];
  musicBase64?: string;  // MP3
  musicMime?: string;
}

// ── WAV concatenation with silence for B-roll gaps ──────────────────────────

function buildDialogueTrack(beats: DialogueBeat[]): Buffer | null {
  const sorted = [...beats].sort((a, b) => a.beatNumber - b.beatNumber);
  let fmtChunk: Buffer | null = null;
  const dataChunks: Buffer[] = [];

  for (const beat of sorted) {
    const buf = Buffer.from(beat.audioBase64, "base64");
    const parsed = parseWAV(buf);

    if (!parsed) {
      // B-roll or missing audio — insert silence using existing fmt
      if (fmtChunk) {
        dataChunks.push(createSilencePCM(fmtChunk, beat.durationSec));
      }
      continue;
    }

    if (!fmtChunk) fmtChunk = parsed.fmt;
    dataChunks.push(parsed.data);
  }

  if (!fmtChunk || dataChunks.length === 0) return null;
  return buildWAV(fmtChunk, dataChunks);
}

// ── ffmpeg helpers ────────────────────────────────────────────────────────────

function ffmpegAvailable(): boolean {
  const result = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return result.status === 0;
}

function writeTmp(ext: string, data: Buffer): string {
  const p = path.join(os.tmpdir(), `viralvids_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  fs.writeFileSync(p, data);
  return p;
}

function runFfmpeg(args: string[]): { ok: boolean; stderr: string } {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8", timeout: 120_000 });
  return { ok: result.status === 0, stderr: result.stderr ?? "" };
}

// ── Mix layers with ffmpeg ─────────────────────────────────────────────────
// Tries 3-layer (dialogue + sfx + music), falls back to 2-layer (dialogue + sfx),
// then falls back to dialogue-only WAV.

function mixWithFfmpeg(
  dialogueWav: Buffer,
  sfxMp3: Buffer | null,
  musicMp3: Buffer | null
): { audioBase64: string; audioMime: string; layers: number } {
  const tmpFiles: string[] = [];

  try {
    const dialoguePath = writeTmp("wav", dialogueWav);
    tmpFiles.push(dialoguePath);

    const outPath = path.join(os.tmpdir(), `viralvids_out_${Date.now()}.mp3`);
    tmpFiles.push(outPath);

    // Try 3-layer
    if (sfxMp3 && musicMp3) {
      const sfxPath = writeTmp("mp3", sfxMp3);
      const musicPath = writeTmp("mp3", musicMp3);
      tmpFiles.push(sfxPath, musicPath);

      const filter = [
        "[0:a]volume=1.0[d]",
        "[1:a]volume=0.45[s]",
        "[2:a]volume=0.18[m]",
        "[d][s][m]amix=inputs=3:duration=first:normalize=0[out]",
      ].join(";");

      const { ok } = runFfmpeg([
        "-y",
        "-i", dialoguePath,
        "-i", sfxPath,
        "-i", musicPath,
        "-filter_complex", filter,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "128k",
        outPath,
      ]);

      if (ok && fs.existsSync(outPath)) {
        const audioBase64 = fs.readFileSync(outPath).toString("base64");
        return { audioBase64, audioMime: "audio/mpeg", layers: 3 };
      }
    }

    // Try 2-layer (dialogue + sfx)
    if (sfxMp3) {
      const sfxPath = writeTmp("mp3", sfxMp3);
      tmpFiles.push(sfxPath);

      const filter = [
        "[0:a]volume=1.0[d]",
        "[1:a]volume=0.45[s]",
        "[d][s]amix=inputs=2:duration=first:normalize=0[out]",
      ].join(";");

      const { ok } = runFfmpeg([
        "-y",
        "-i", dialoguePath,
        "-i", sfxPath,
        "-filter_complex", filter,
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "128k",
        outPath,
      ]);

      if (ok && fs.existsSync(outPath)) {
        const audioBase64 = fs.readFileSync(outPath).toString("base64");
        return { audioBase64, audioMime: "audio/mpeg", layers: 2 };
      }
    }

    // Fallback: dialogue-only WAV
    const audioBase64 = dialogueWav.toString("base64");
    return { audioBase64, audioMime: "audio/wav", layers: 1 };
  } finally {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: MixRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dialogueBeats, sfxBeats = [], musicBase64, musicMime } = body;

  if (!Array.isArray(dialogueBeats) || dialogueBeats.length === 0) {
    return NextResponse.json({ error: "No dialogue beats provided" }, { status: 400 });
  }

  // Build the dialogue track (WAV with silence for B-roll gaps)
  const dialogueWav = buildDialogueTrack(dialogueBeats);
  if (!dialogueWav) {
    return NextResponse.json({ error: "Failed to build dialogue WAV track" }, { status: 500 });
  }

  // Concatenate all SFX beats into one MP3 (simple concat via ffmpeg, or null if none)
  let sfxMp3: Buffer | null = null;
  if (sfxBeats.length > 0 && ffmpegAvailable()) {
    const tmpFiles: string[] = [];
    try {
      const sfxPaths = sfxBeats
        .sort((a, b) => a.beatNumber - b.beatNumber)
        .map((b) => {
          const p = writeTmp("mp3", Buffer.from(b.audioBase64, "base64"));
          tmpFiles.push(p);
          return p;
        });

      const listPath = writeTmp("txt", Buffer.from(sfxPaths.map((p) => `file '${p}'`).join("\n")));
      tmpFiles.push(listPath);
      const outPath = path.join(os.tmpdir(), `viralvids_sfxcat_${Date.now()}.mp3`);
      tmpFiles.push(outPath);

      const { ok } = runFfmpeg([
        "-y", "-f", "concat", "-safe", "0",
        "-i", listPath,
        "-c", "copy",
        outPath,
      ]);

      if (ok && fs.existsSync(outPath)) {
        sfxMp3 = fs.readFileSync(outPath);
      }
    } finally {
      for (const f of tmpFiles) {
        try { fs.unlinkSync(f); } catch { /* ignore */ }
      }
    }
  }

  const musicMp3 = musicBase64 ? Buffer.from(musicBase64, "base64") : null;

  // Parse duration from dialogue WAV
  const parsed = parseWAV(dialogueWav);
  const durationSec = parsed
    ? wavDurationSec(parsed.fmt, parsed.data.length)
    : 0;

  // Mix layers
  const hasFfmpeg = ffmpegAvailable();
  let mixResult: { audioBase64: string; audioMime: string; layers: number };

  if (hasFfmpeg) {
    mixResult = mixWithFfmpeg(dialogueWav, sfxMp3, musicMp3);
  } else {
    // No ffmpeg — return dialogue-only WAV
    mixResult = {
      audioBase64: dialogueWav.toString("base64"),
      audioMime: "audio/wav",
      layers: 1,
    };
  }

  return NextResponse.json({
    audioBase64: mixResult.audioBase64,
    audioMime: mixResult.audioMime,
    durationSec,
    layers: mixResult.layers,
  });
}
