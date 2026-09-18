import { NextRequest, NextResponse } from "next/server";

interface ConcatBeat {
  beatNumber: number;
  audioBase64: string;
  audioMime: string;
}

/**
 * Parse a WAV buffer and return its fmt and data chunks.
 * Handles WAV files with variable-length fmt chunks (PCM, IEEE float, etc).
 */
function parseWAV(buf: Buffer): { fmt: Buffer; data: Buffer } | null {
  if (buf.length < 12) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buf.toString("ascii", 8, 12) !== "WAVE") return null;

  let fmt: Buffer | null = null;
  let data: Buffer | null = null;
  let i = 12;

  while (i + 8 <= buf.length) {
    const id = buf.toString("ascii", i, i + 4);
    const size = buf.readUInt32LE(i + 4);
    if (id === "fmt ") {
      fmt = buf.slice(i + 8, i + 8 + size);
    } else if (id === "data") {
      data = buf.slice(i + 8, i + 8 + size);
    }
    // WAV chunks are word-aligned (pad byte if odd size)
    i += 8 + size + (size % 2 !== 0 ? 1 : 0);
    if (fmt && data) break;
  }

  if (!fmt || !data) return null;
  return { fmt, data };
}

/**
 * Build a new WAV file from a fmt chunk and array of data chunks.
 * Uses the fmt chunk from the first beat; all beats must share the same format.
 */
function buildWAV(fmt: Buffer, chunks: Buffer[]): Buffer {
  const dataLen = chunks.reduce((s, c) => s + c.length, 0);
  const fmtSize = fmt.length;
  // Layout: RIFF(4)+size(4)+WAVE(4) | fmt (4)+fmtSize(4)+fmt | data(4)+dataLen(4)
  const headerLen = 4 + 4 + 4 + 4 + 4 + fmtSize + 4 + 4;
  const header = Buffer.alloc(headerLen);
  let o = 0;
  header.write("RIFF", o);           o += 4;
  header.writeUInt32LE(headerLen - 8 + dataLen, o); o += 4;
  header.write("WAVE", o);           o += 4;
  header.write("fmt ", o);           o += 4;
  header.writeUInt32LE(fmtSize, o);  o += 4;
  fmt.copy(header, o);               o += fmtSize;
  header.write("data", o);           o += 4;
  header.writeUInt32LE(dataLen, o);
  return Buffer.concat([header, ...chunks]);
}

export async function POST(req: NextRequest) {
  let body: { beats: ConcatBeat[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { beats } = body;
  if (!beats?.length) {
    return NextResponse.json({ error: "No beats provided" }, { status: 400 });
  }

  // Sort by beat number to guarantee correct playback order
  const sorted = [...beats].sort((a, b) => a.beatNumber - b.beatNumber);

  let fmtChunk: Buffer | null = null;
  const dataChunks: Buffer[] = [];

  for (const beat of sorted) {
    if (!beat.audioBase64) {
      return NextResponse.json(
        { error: `Beat ${beat.beatNumber} has no audio data` },
        { status: 400 }
      );
    }
    const buf = Buffer.from(beat.audioBase64, "base64");
    const parsed = parseWAV(buf);
    if (!parsed) {
      return NextResponse.json(
        { error: `Beat ${beat.beatNumber} is not a valid WAV file (mime: ${beat.audioMime})` },
        { status: 400 }
      );
    }
    if (!fmtChunk) fmtChunk = parsed.fmt;
    dataChunks.push(parsed.data);
  }

  if (!fmtChunk) {
    return NextResponse.json({ error: "No WAV format chunk found" }, { status: 500 });
  }

  const combined = buildWAV(fmtChunk, dataChunks);

  // Compute duration from fmt chunk fields
  // fmt layout: AudioFormat(2) NumChannels(2) SampleRate(4) ByteRate(4) BlockAlign(2) BitsPerSample(2)
  const numChannels  = fmtChunk.readUInt16LE(2);
  const sampleRate   = fmtChunk.readUInt32LE(4);
  const bitsPerSample = fmtChunk.readUInt16LE(14);
  const bytesPerSample = bitsPerSample / 8;
  const totalDataBytes = dataChunks.reduce((s, c) => s + c.length, 0);
  const durationSec = totalDataBytes / (sampleRate * numChannels * bytesPerSample);

  return NextResponse.json({
    audioBase64: combined.toString("base64"),
    audioMime: "audio/wav",
    durationSec,
  });
}
