import type { CliOptions } from "./types.js";

export function parseArgs(argv: string[]): CliOptions {
  const [, , scriptPath, ...rest] = argv;

  if (!scriptPath || scriptPath.startsWith("-")) {
    throw new Error(
      "Usage: npm run generate -- <script.yaml> [--force] [--only block_002] [--blocks-only] [--dry-run] [--yes]",
    );
  }

  const options: CliOptions = {
    scriptPath,
    force: false,
    blocksOnly: false,
    dryRun: false,
    yes: false,
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--blocks-only") {
      options.blocksOnly = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--yes") {
      options.yes = true;
      continue;
    }
    if (arg === "--only") {
      const value = rest[i + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--only requires a block id.");
      }
      options.only = value;
      i += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}
