/**
 * Shared WAV PCM utilities — parse, build, and generate silence.
 * Used by /api/concatenate-audio and /api/mix-episode.
 */

export interface WavParsed {
  fmt: Buffer;
  data: Buffer;
}

/**
 * Parse a WAV buffer and return its fmt and data chunks.
 * Handles WAV files with variable-length fmt chunks (PCM, IEEE float, etc).
 */
export function parseWAV(buf: Buffer): WavParsed | null {
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
export function buildWAV(fmt: Buffer, chunks: Buffer[]): Buffer {
  const dataLen = chunks.reduce((s, c) => s + c.length, 0);
  const fmtSize = fmt.length;
  // Layout: RIFF(4)+size(4)+WAVE(4) | fmt (4)+fmtSize(4)+fmt | data(4)+dataLen(4)
  const headerLen = 4 + 4 + 4 + 4 + 4 + fmtSize + 4 + 4;
  const header = Buffer.alloc(headerLen);
  let o = 0;
  header.write("RIFF", o);                          o += 4;
  header.writeUInt32LE(headerLen - 8 + dataLen, o); o += 4;
  header.write("WAVE", o);                          o += 4;
  header.write("fmt ", o);                          o += 4;
  header.writeUInt32LE(fmtSize, o);                 o += 4;
  fmt.copy(header, o);                              o += fmtSize;
  header.write("data", o);                          o += 4;
  header.writeUInt32LE(dataLen, o);
  return Buffer.concat([header, ...chunks]);
}

/**
 * Read audio format fields from a WAV fmt chunk.
 * fmt layout: AudioFormat(2) NumChannels(2) SampleRate(4) ByteRate(4) BlockAlign(2) BitsPerSample(2)
 */
export function readFmtFields(fmt: Buffer) {
  return {
    audioFormat:  fmt.readUInt16LE(0),
    numChannels:  fmt.readUInt16LE(2),
    sampleRate:   fmt.readUInt32LE(4),
    byteRate:     fmt.readUInt32LE(8),
    blockAlign:   fmt.readUInt16LE(12),
    bitsPerSample: fmt.readUInt16LE(14),
  };
}

/**
 * Compute duration of a WAV data chunk in seconds.
 */
export function wavDurationSec(fmt: Buffer, dataBytes: number): number {
  const { numChannels, sampleRate, bitsPerSample } = readFmtFields(fmt);
  return dataBytes / (sampleRate * numChannels * (bitsPerSample / 8));
}

/**
 * Create a PCM silence buffer matching the format of a given fmt chunk.
 */
export function createSilencePCM(fmt: Buffer, durationSec: number): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = readFmtFields(fmt);
  const bytesPerSample = bitsPerSample / 8;
  const totalBytes = Math.ceil(sampleRate * numChannels * bytesPerSample * durationSec);
  // PCM silence = zero-filled buffer
  return Buffer.alloc(totalBytes, 0);
}
