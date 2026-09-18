const WAVESPEED_BASE = "https://api.wavespeed.ai/api/v3";
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 45; // ~90 seconds max wait

interface SubmitResponse {
  code: number;
  message: string;
  data: { id: string };
}

interface PollResponse {
  code: number;
  data: {
    id: string;
    status: "processing" | "queued" | "completed" | "failed" | "cancelled" | "timeout";
    outputs?: string[];
    error?: string;
  };
}

function apiKey(): string {
  const key = process.env.WAVESPEED_API_KEY;
  if (!key) throw new Error("WAVESPEED_API_KEY is not set");
  return key;
}

/** Submit a generation task. Returns the prediction ID. */
export async function submitTask(
  modelPath: string,
  body: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${WAVESPEED_BASE}/${modelPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`WaveSpeed submit failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as SubmitResponse;
  if (json.code !== 200 || !json.data?.id) {
    throw new Error(`WaveSpeed submit error: ${json.message ?? JSON.stringify(json)}`);
  }

  return json.data.id;
}

/** Poll until terminal status, then return the first output URL. */
export async function pollResult(predictionId: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(
      `${WAVESPEED_BASE}/predictions/${predictionId}/result`,
      {
        headers: { Authorization: `Bearer ${apiKey()}` },
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`WaveSpeed poll failed (${res.status}): ${text}`);
    }

    const json = (await res.json()) as PollResponse;
    const { status, outputs, error } = json.data;

    if (status === "completed") {
      const url = outputs?.[0];
      if (!url) throw new Error("WaveSpeed returned completed but no output URL");
      return url;
    }

    if (status === "failed" || status === "cancelled" || status === "timeout") {
      throw new Error(`WaveSpeed generation ${status}: ${error ?? "no details"}`);
    }

    // status === "processing" | "queued" — keep polling
  }

  throw new Error(
    `WaveSpeed timed out after ${(MAX_POLLS * POLL_INTERVAL_MS) / 1000}s`
  );
}

/** Submit + poll in one call. Returns the output image URL. */
export async function generate(
  modelPath: string,
  body: Record<string, unknown>
): Promise<string> {
  const id = await submitTask(modelPath, body);
  return pollResult(id);
}
