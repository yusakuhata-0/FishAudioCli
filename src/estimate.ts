import { existsSync } from "node:fs";
import { blockCacheKey, cacheFile, segmentCacheKey } from "./cache.js";
import { splitIntoSegments } from "./parser.js";
import type { GenerationEstimate, ScriptConfig } from "./types.js";

const COST_PER_MILLION_UTF8_BYTES_USD = 15;

export function estimateGeneration(
  config: ScriptConfig,
  cacheDir: string,
  selectedBlocks: ScriptConfig["blocks"],
  force: boolean,
): GenerationEstimate {
  const blocks = selectedBlocks.map((block) => {
    const segments = splitIntoSegments(block.text, config.pause);
    const segmentCacheFiles = segments.map((segment) => {
      const key = segmentCacheKey(config, block.id, segment.index, segment.text);
      return cacheFile(cacheDir, key, config.model.format);
    });
    const isCached = segmentCacheFiles.length > 0 && segmentCacheFiles.every((file) => existsSync(file));
    const utf8Bytes = force || !isCached ? Buffer.byteLength(block.text, "utf8") : 0;

    return {
      id: block.id,
      text: block.text,
      utf8Bytes,
      isCached,
      cacheKey: blockCacheKey(config, block.id, block.text),
    };
  });

  const generatedBlocks = blocks.filter((block) => force || !block.isCached).length;
  const usedCacheBlocks = force ? 0 : blocks.filter((block) => block.isCached).length;
  const utf8Bytes = blocks.reduce((sum, block) => sum + block.utf8Bytes, 0);

  return {
    totalBlocks: selectedBlocks.length,
    generatedBlocks,
    usedCacheBlocks,
    utf8Bytes,
    estimatedCostUsd: estimateCostUsd(utf8Bytes),
    force,
    blocks,
  };
}

export function estimateCostUsd(utf8Bytes: number): number {
  return Number(((utf8Bytes / 1_000_000) * COST_PER_MILLION_UTF8_BYTES_USD).toFixed(4));
}

export function formatEstimateUsd(value: number): string {
  return `$${value.toFixed(4)}`;
}
