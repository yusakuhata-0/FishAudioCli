import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type { ScriptConfig } from "./types.js";

const envPattern = /\$\{([A-Z0-9_]+)\}/g;

export async function loadScriptConfig(scriptPath: string): Promise<ScriptConfig> {
  const raw = await readFile(scriptPath, "utf8");
  const expanded = raw.replace(envPattern, (_match, name: string) => process.env[name] ?? "");
  const config = YAML.parse(expanded) as Partial<ScriptConfig>;
  return normalizeConfig(config, scriptPath);
}

function normalizeConfig(config: Partial<ScriptConfig>, scriptPath: string): ScriptConfig {
  if (!config.voice?.reference_id) {
    throw new Error("voice.reference_id is required. Set FISH_REFERENCE_ID in .env or script.yaml.");
  }

  if (!config.blocks?.length) {
    throw new Error("blocks must contain at least one block.");
  }

  const baseDir = path.dirname(path.resolve(scriptPath));
  const blockDir = config.output?.block_dir ?? "dist/blocks";
  const masterFile = config.output?.master_file ?? "dist/master.mp3";

  return {
    voice: {
      reference_id: config.voice.reference_id,
    },
    model: {
      name: config.model?.name ?? "s2-pro",
      temperature: config.model?.temperature ?? 0.25,
      top_p: config.model?.top_p ?? 0.6,
      speed: config.model?.speed ?? 1.0,
      format: config.model?.format ?? "mp3",
      bitrate: config.model?.bitrate ?? "192k",
      condition_on_previous_chunks: config.model?.condition_on_previous_chunks ?? false,
      latency: config.model?.latency ?? "normal",
    },
    pause: {
      "、": config.pause?.["、"] ?? 300,
      "。": config.pause?.["。"] ?? 700,
      "！": config.pause?.["！"] ?? 800,
      "？": config.pause?.["？"] ?? 800,
      line_break: config.pause?.line_break ?? 1000,
      block: config.pause?.block ?? 1200,
    },
    output: {
      block_dir: path.resolve(baseDir, blockDir),
      master_file: path.resolve(baseDir, masterFile),
    },
    blocks: config.blocks.map((block, index) => {
      if (!block.id) {
        throw new Error(`blocks[${index}].id is required.`);
      }
      if (!block.text) {
        throw new Error(`blocks[${index}].text is required.`);
      }
      return { id: block.id, text: block.text, pause_after: block.pause_after };
    }),
  };
}
