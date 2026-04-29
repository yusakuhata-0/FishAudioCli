# script.yaml Reference

`script.yaml` is the local generation plan. It is ignored by Git because it usually contains project-specific text.

## Fields

```yaml
voice:
  reference_id: ${FISH_REFERENCE_ID}

model:
  name: s2-pro
  temperature: 0.25
  top_p: 0.6
  speed: 1.0
  format: mp3
  bitrate: 192k
  condition_on_previous_chunks: false
  latency: balanced
  chunk_length: 300
  normalize: false
  normalize_loudness: true

pause:
  "、": 0
  "。": 0
  "！": 0
  "？": 0
  line_break: 0
  block: 750

output:
  block_dir: dist/blocks
  master_file: dist/master.mp3

blocks:
  - id: block_001
    text: "Text to generate."
    pause_after: 750
```

## `pause_after`

`pause_after` is optional and overrides the global `pause.block` after that block only.

Use it when a storyboard or source image explicitly says the pause should be different from the default.

## Punctuation Pauses

Set punctuation pauses to `0` when you want Fish Audio to handle punctuation naturally inside the generated block.

Use punctuation pauses above `0` only when you intentionally want the CLI to split at that punctuation and insert exact silence.

## Generation Quality / Normalization

Current default generation settings match the web workflow used for the Ochi model:

- high-quality mode on: `latency: balanced`, `chunk_length: 300`
- text normalization off: `normalize: false`
- loudness normalization on: `normalize_loudness: true`

With `normalize: false`, write readings directly into the script text when needed, for example `25%` -> `二十五パーセント` or `YouTube` -> `ユーチューブ`.
