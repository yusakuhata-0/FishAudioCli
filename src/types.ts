export type AudioFormat = "mp3" | "wav" | "opus";

export type ScriptConfig = {
  voice: {
    reference_id: string;
  };
  model: {
    name: string;
    temperature: number;
    top_p: number;
    speed: number;
    format: AudioFormat;
    bitrate?: string;
    condition_on_previous_chunks: boolean;
    latency?: "normal" | "balanced";
    chunk_length?: number;
    normalize: boolean;
    normalize_loudness: boolean;
  };
  pause: {
    "、": number;
    "。": number;
    "！": number;
    "？": number;
    line_break: number;
    block: number;
  };
  output: {
    block_dir: string;
    master_file: string;
  };
  blocks: Array<{
    id: string;
    text: string;
    pause_after?: number;
  }>;
};

export type CliOptions = {
  scriptPath: string;
  force: boolean;
  only?: string;
  blocksOnly: boolean;
  dryRun: boolean;
  yes: boolean;
};

export type Segment = {
  text: string;
  pauseMs: number;
  index: number;
};

export type ManifestBlock = {
  id: string;
  text: string;
  file: string;
  cache_key: string;
  pause_after?: number;
  segments: Array<{
    text: string;
    cache_key: string;
  }>;
};

export type Manifest = {
  generated_at: string;
  reference_id: string;
  model: string;
  blocks: ManifestBlock[];
  master_file?: string;
  estimated_utf8_bytes?: number;
  estimated_cost_usd?: number;
  used_cache_blocks?: number;
  generated_blocks?: number;
  api_credit?: string | "unknown";
  has_free_credit?: boolean | "unknown";
};

export type CreditInfo = {
  credit: string | "unknown";
  has_free_credit: boolean | "unknown";
};

export type EstimateBlock = {
  id: string;
  text: string;
  utf8Bytes: number;
  isCached: boolean;
  cacheKey: string;
};

export type GenerationEstimate = {
  totalBlocks: number;
  generatedBlocks: number;
  usedCacheBlocks: number;
  utf8Bytes: number;
  estimatedCostUsd: number;
  force: boolean;
  blocks: EstimateBlock[];
};
