import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { cacheFile, segmentCacheKey } from "./cache.js";
import { estimateCostUsd, estimateGeneration } from "./estimate.js";
import type { ScriptConfig } from "./types.js";

test("estimateCostUsd uses UTF-8 bytes at $15 per million", () => {
  assert.equal(Buffer.byteLength("あ", "utf8"), 3);
  assert.equal(estimateCostUsd(1_000_000), 15);
  assert.equal(estimateCostUsd(Buffer.byteLength("あいう", "utf8")), 0.0001);
});

test("estimateGeneration excludes fully cached blocks unless force is true", async () => {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "fish-estimate-test-"));

  try {
    const config = makeConfig();
    const block = config.blocks[0];
    const segmentKey = segmentCacheKey(config, block.id, 0, block.text);
    await writeFile(cacheFile(cacheDir, segmentKey, config.model.format), "cached");

    const cachedEstimate = estimateGeneration(config, cacheDir, config.blocks, false);
    assert.equal(cachedEstimate.generatedBlocks, 0);
    assert.equal(cachedEstimate.usedCacheBlocks, 1);
    assert.equal(cachedEstimate.utf8Bytes, 0);

    const forceEstimate = estimateGeneration(config, cacheDir, config.blocks, true);
    assert.equal(forceEstimate.generatedBlocks, 1);
    assert.equal(forceEstimate.usedCacheBlocks, 0);
    assert.equal(forceEstimate.utf8Bytes, Buffer.byteLength(block.text, "utf8"));
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
});

function makeConfig(): ScriptConfig {
  return {
    voice: { reference_id: "voice_123" },
    model: {
      name: "s2-pro",
      temperature: 0.25,
      top_p: 0.6,
      speed: 1,
      format: "mp3",
      bitrate: "192k",
      condition_on_previous_chunks: false,
      latency: "normal",
    },
    pause: {
      "、": 300,
      "。": 700,
      "！": 800,
      "？": 800,
      line_break: 1000,
      block: 1200,
    },
    output: {
      block_dir: "dist/blocks",
      master_file: "dist/master.mp3",
    },
    blocks: [{ id: "block_001", text: "こんにちは。" }],
  };
}
