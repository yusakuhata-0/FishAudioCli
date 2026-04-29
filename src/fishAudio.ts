import { writeFile } from "node:fs/promises";
import type { ScriptConfig } from "./types.js";

export async function generateTts(config: ScriptConfig, text: string, outputFile: string): Promise<void> {
  const apiKey = process.env.FISH_API_KEY;
  if (!apiKey) {
    throw new Error("FISH_API_KEY is required. Set it in .env.");
  }

  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      model: config.model.name,
    },
    body: JSON.stringify({
      text,
      reference_id: config.voice.reference_id,
      format: config.model.format,
      mp3_bitrate: parseBitrate(config.model.bitrate),
      latency: config.model.latency ?? "normal",
      chunk_length: config.model.chunk_length,
      normalize: config.model.normalize,
      temperature: config.model.temperature,
      top_p: config.model.top_p,
      prosody: {
        speed: config.model.speed,
        volume: 0,
        normalize_loudness: config.model.normalize_loudness,
      },
      condition_on_previous_chunks: config.model.condition_on_previous_chunks,
    }),
  });

  if (!res.ok) {
    throw new Error(await formatApiError(res));
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(outputFile, buffer);
}

function parseBitrate(bitrate?: string): number | undefined {
  if (!bitrate) {
    return undefined;
  }
  const match = bitrate.match(/^(\d+)k$/i);
  if (!match) {
    return undefined;
  }
  return Number(match[1]);
}

async function formatApiError(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  let details = "";

  if (contentType.includes("application/json")) {
    const body = (await res.json().catch(() => null)) as { status?: number; message?: string } | null;
    details = body?.message ? `: ${body.message}` : "";
  } else {
    const text = await res.text().catch(() => "");
    details = text ? `: ${text.slice(0, 500)}` : "";
  }

  return `Fish Audio API request failed (${res.status} ${res.statusText})${details}`;
}
