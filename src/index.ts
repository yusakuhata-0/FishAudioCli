import "dotenv/config";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { getApiCredit, formatCreditWarning } from "./billing.js";
import { parseArgs } from "./cli.js";
import { loadScriptConfig } from "./config.js";
import { concatAudio, createSilence } from "./audioJoiner.js";
import { blockCacheKey, cacheFile, segmentCacheKey } from "./cache.js";
import { estimateGeneration, formatEstimateUsd } from "./estimate.js";
import { generateTts } from "./fishAudio.js";
import { splitIntoSegments } from "./parser.js";
import type { CreditInfo, GenerationEstimate, Manifest, ManifestBlock, ScriptConfig } from "./types.js";

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const config = await loadScriptConfig(options.scriptPath);
  const cacheDir = path.resolve(path.dirname(path.resolve(options.scriptPath)), "cache");

  await mkdir(cacheDir, { recursive: true });
  await mkdir(config.output.block_dir, { recursive: true });
  await mkdir(path.dirname(config.output.master_file), { recursive: true });

  const selectedBlocks = options.only
    ? config.blocks.filter((block) => block.id === options.only)
    : config.blocks;

  if (options.only && selectedBlocks.length === 0) {
    throw new Error(`Block not found: ${options.only}`);
  }

  if (options.force) {
    console.warn("--force が指定されています。");
    console.warn("キャッシュ済みブロックも再生成されるため、API課金が再度発生する可能性があります。");
  }

  const estimate = estimateGeneration(config, cacheDir, selectedBlocks, options.force);
  const credit = await getApiCredit();
  printPreflight(estimate, credit);

  if (options.dryRun) {
    console.log("dry-run のため音声生成は実行しません。");
    return;
  }

  await confirmGenerationIfInteractive(options.yes);

  const manifestBlocks: ManifestBlock[] = [];

  for (const block of selectedBlocks) {
    manifestBlocks.push(await generateBlock(config, cacheDir, block.id, block.text, block.pause_after, options.force));
  }

  const allManifestBlocks = options.only
    ? await mergeWithExistingManifest(config, manifestBlocks)
    : manifestBlocks;

  const manifest: Manifest = {
    generated_at: new Date().toISOString(),
    reference_id: config.voice.reference_id,
    model: config.model.name,
    blocks: allManifestBlocks,
    master_file: options.blocksOnly ? undefined : config.output.master_file,
    estimated_utf8_bytes: estimate.utf8Bytes,
    estimated_cost_usd: estimate.estimatedCostUsd,
    used_cache_blocks: estimate.usedCacheBlocks,
    generated_blocks: estimate.generatedBlocks,
    api_credit: credit.credit,
    has_free_credit: credit.has_free_credit,
  };

  if (!options.blocksOnly) {
    await generateMaster(config, allManifestBlocks);
  }

  await writeFile(
    path.join(path.dirname(config.output.master_file), "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log("生成が完了しました。");
  if (!options.blocksOnly) {
    console.log(`- 全体音声: ${config.output.master_file}`);
  }
  console.log(`- ブロック音声: ${config.output.block_dir}`);
  console.log(`- 管理ファイル: ${path.join(path.dirname(config.output.master_file), "manifest.json")}`);
  console.log("再生成したいブロックがあれば、block_idを指定してください。");
}

function printPreflight(estimate: GenerationEstimate, credit: CreditInfo): void {
  const warning = formatCreditWarning(credit);
  if (warning) {
    console.warn(warning);
  }

  console.log("生成前確認:");
  console.log(`- 対象ブロック数: ${estimate.totalBlocks}`);
  console.log(`- 新規生成: ${estimate.generatedBlocks}`);
  console.log(`- キャッシュ利用: ${estimate.usedCacheBlocks}`);
  console.log(`- UTF-8 bytes: ${estimate.utf8Bytes}`);
  console.log(`- 概算API料金: 約 ${formatEstimateUsd(estimate.estimatedCostUsd)}`);
  console.log(`- API credit: ${credit.credit}`);
  console.log(`- has_free_credit: ${credit.has_free_credit}`);
  console.log(`- --force: ${estimate.force}`);
}

async function confirmGenerationIfInteractive(skipConfirm: boolean): Promise<void> {
  if (skipConfirm || !input.isTTY || !output.isTTY) {
    return;
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("この内容で生成しますか？ [y/N] ");
    if (!["y", "yes"].includes(answer.trim().toLowerCase())) {
      throw new Error("生成をキャンセルしました。");
    }
  } finally {
    rl.close();
  }
}

async function generateBlock(
  config: ScriptConfig,
  cacheDir: string,
  blockId: string,
  text: string,
  pauseAfter: number | undefined,
  force: boolean,
): Promise<ManifestBlock> {
  const format = config.model.format;
  const blockKey = blockCacheKey(config, blockId, text);
  const blockFile = path.join(config.output.block_dir, `${blockId}.${format}`);
  const segments = splitIntoSegments(text, config.pause);
  const blockParts: string[] = [];
  const segmentManifest: ManifestBlock["segments"] = [];

  for (const segment of segments) {
    const key = segmentCacheKey(config, blockId, segment.index, segment.text);
    const cachedAudio = cacheFile(cacheDir, key, format);
    const segmentFile = path.join(config.output.block_dir, `${blockId}_part_${String(segment.index + 1).padStart(3, "0")}.${format}`);

    if (force || !existsSync(cachedAudio)) {
      console.log(`Generating ${blockId} part ${segment.index + 1}`);
      await generateTts(config, segment.text, cachedAudio);
    } else {
      console.log(`Using cache ${blockId} part ${segment.index + 1}`);
    }

    await copyFile(cachedAudio, segmentFile);
    blockParts.push(segmentFile);
    segmentManifest.push({ text: segment.text, cache_key: key });

    if (segment.pauseMs > 0) {
      const silenceFile = path.join(
        config.output.block_dir,
        `${blockId}_silence_${String(segment.index + 1).padStart(3, "0")}.${format}`,
      );
      await createSilence(silenceFile, segment.pauseMs, format);
      blockParts.push(silenceFile);
    }
  }

  await concatAudio(blockParts, blockFile);
  console.log(`Wrote block: ${blockFile}`);

  return {
    id: blockId,
    text,
    file: blockFile,
    cache_key: blockKey,
    pause_after: pauseAfter,
    segments: segmentManifest,
  };
}

async function generateMaster(config: ScriptConfig, manifestBlocks: ManifestBlock[]): Promise<void> {
  const format = config.model.format;
  const parts: string[] = [];

  for (let index = 0; index < manifestBlocks.length; index += 1) {
    parts.push(manifestBlocks[index].file);

    const blockPause = manifestBlocks[index].pause_after ?? config.pause.block;
    if (index < manifestBlocks.length - 1 && blockPause > 0) {
      const silenceFile = path.join(config.output.block_dir, `_block_silence_${String(index + 1).padStart(3, "0")}.${format}`);
      await createSilence(silenceFile, blockPause, format);
      parts.push(silenceFile);
    }
  }

  await concatAudio(parts, config.output.master_file);
}

async function mergeWithExistingManifest(
  config: ScriptConfig,
  changedBlocks: ManifestBlock[],
): Promise<ManifestBlock[]> {
  const manifestPath = path.join(path.dirname(config.output.master_file), "manifest.json");
  const changed = new Map(changedBlocks.map((block) => [block.id, block]));

  return config.blocks.map((block) => {
    const replacement = changed.get(block.id);
    if (replacement) {
      return replacement;
    }

    const file = path.join(config.output.block_dir, `${block.id}.${config.model.format}`);
    if (!existsSync(file)) {
      throw new Error(`Missing existing block audio for --only run: ${file}`);
    }

    return {
      id: block.id,
      text: block.text,
      file,
      cache_key: blockCacheKey(config, block.id, block.text),
      pause_after: block.pause_after,
      segments: [],
    };
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
