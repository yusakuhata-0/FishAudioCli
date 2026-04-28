import type { Segment, ScriptConfig } from "./types.js";

const punctuation = new Set(["、", "。", "！", "？"]);

export function splitIntoSegments(text: string, pause: ScriptConfig["pause"]): Segment[] {
  const segments: Segment[] = [];
  let current = "";

  for (const char of text) {
    current += char;

    if (punctuation.has(char) && pause[char as keyof Pick<ScriptConfig["pause"], "、" | "。" | "！" | "？">] > 0) {
      segments.push({
        text: current,
        pauseMs: pause[char as keyof Pick<ScriptConfig["pause"], "、" | "。" | "！" | "？">],
        index: segments.length,
      });
      current = "";
    } else if (char === "\n") {
      const trimmed = current.trim();
      if (trimmed) {
        segments.push({ text: trimmed, pauseMs: pause.line_break, index: segments.length });
      }
      current = "";
    }
  }

  const trailing = current.trim();
  if (trailing) {
    segments.push({ text: trailing, pauseMs: 0, index: segments.length });
  }

  return segments;
}
