import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;

export async function createSilence(outputFile: string, ms: number, format: string): Promise<void> {
  if (ms <= 0) {
    return;
  }
  await mkdir(path.dirname(outputFile), { recursive: true });
  const seconds = (ms / 1000).toFixed(3);
  const codecArgs = format === "wav" ? ["-c:a", "pcm_s16le"] : ["-c:a", "libmp3lame", "-b:a", "192k"];
  await runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=44100:cl=mono",
    "-t",
    seconds,
    ...codecArgs,
    outputFile,
  ]);
}

export async function concatAudio(inputs: string[], outputFile: string): Promise<void> {
  if (inputs.length === 0) {
    throw new Error(`No input files for ${outputFile}.`);
  }

  await mkdir(path.dirname(outputFile), { recursive: true });
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "fish-audio-concat-"));
  const listFile = path.join(tempDir, "inputs.txt");

  try {
    const list = inputs.map((input) => `file '${escapeConcatPath(input)}'`).join("\n");
    await writeFile(listFile, `${list}\n`, "utf8");
    await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outputFile]);
  } catch (error) {
    await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listFile, outputFile]);
    return;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function escapeConcatPath(input: string): string {
  return path.resolve(input).replaceAll("'", "'\\''");
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg-static did not provide an ffmpeg binary."));
      return;
    }

    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg failed with code ${code}: ${stderr.slice(-1000)}`));
      }
    });
  });
}
