import { createHash } from "node:crypto";
import path from "node:path";
import type { ScriptConfig } from "./types.js";

export function cacheKey(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex");
}

export function blockCacheKey(config: ScriptConfig, blockId: string, text: string): string {
  return cacheKey({
    model_name: config.model.name,
    reference_id: config.voice.reference_id,
    block_id: blockId,
    text,
    temperature: config.model.temperature,
    top_p: config.model.top_p,
    speed: config.model.speed,
    format: config.model.format,
    bitrate: config.model.bitrate,
    latency: config.model.latency,
    chunk_length: config.model.chunk_length,
    normalize: config.model.normalize,
    normalize_loudness: config.model.normalize_loudness,
    pause_settings: config.pause,
    condition_on_previous_chunks: config.model.condition_on_previous_chunks,
  });
}

export function segmentCacheKey(config: ScriptConfig, blockId: string, segmentIndex: number, text: string): string {
  return cacheKey({
    model_name: config.model.name,
    reference_id: config.voice.reference_id,
    block_id: blockId,
    segment_index: segmentIndex,
    text,
    temperature: config.model.temperature,
    top_p: config.model.top_p,
    speed: config.model.speed,
    format: config.model.format,
    bitrate: config.model.bitrate,
    latency: config.model.latency,
    chunk_length: config.model.chunk_length,
    normalize: config.model.normalize,
    normalize_loudness: config.model.normalize_loudness,
    condition_on_previous_chunks: config.model.condition_on_previous_chunks,
  });
}

export function cacheFile(cacheDir: string, key: string, format: string): string {
  return path.join(cacheDir, `${key}.${format}`);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
