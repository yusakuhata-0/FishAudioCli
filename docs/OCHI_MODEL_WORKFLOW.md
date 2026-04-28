# Ochi Masato Model Workflow

Use this workflow for the Ochi Masato custom Fish Audio model.

## Default Text Policy

- Use `オチまさとです。` for the self-introduction.
- Keep Japanese narration in natural written Japanese.
- Rewrite unstable readings before generation:
  - `25%` -> `二十五パーセント`
  - `YouTube` -> `ユーチューブ`
  - English titles can remain in English if the model reads them acceptably; otherwise write a Japanese reading.

## Pause Policy

Do not add artificial silence at every punctuation mark for this model.

Accepted generation defaults:

```yaml
model:
  name: s2-pro
  temperature: 0.25
  top_p: 0.6
  speed: 1.0
  format: mp3
  bitrate: 192k
  condition_on_previous_chunks: false
```

Accepted pause defaults:

```yaml
pause:
  "、": 0
  "。": 0
  "！": 0
  "？": 0
  line_break: 0
  block: 750
```

Fish Audio should handle natural Japanese comma and sentence pauses inside each block. Only explicit source pauses become block boundaries.

Use `pause_after` for storyboard/source-level pauses:

```yaml
blocks:
  - id: block_001
    text: "皆さんこんにちは、"
    pause_after: 200

  - id: block_002
    text: "オチまさとです。"
    pause_after: 750
```

The currently accepted intro timing is:

- `皆さんこんにちは、` -> 0.20s
- `オチまさとです。` -> 0.75s
- Default later block gap -> 0.75s

## Source Image / Storyboard Conversion

When a source image shows pause chips such as `0.20s` or `0.75s`:

- Treat the text before each chip as one block.
- Put the chip value on that block as `pause_after`.
- Do not further split that block by punctuation.

Example:

```yaml
blocks:
  - id: block_001
    text: "皆さんこんにちは、"
    pause_after: 200

  - id: block_002
    text: "オチまさとです。"
    pause_after: 750
```

## Iteration

If one phrase is bad:

1. Create a local preview script, ignored by Git.
2. Generate 5-10 takes of the phrase with the exact target wording.
3. Pick the best take.
4. Copy that take into the target block or regenerate the target block with the chosen text.
5. Rebuild `master.mp3`.

For the intro name, 10-take testing found `オチまさとです。` to be better than spacing variants like `おち まさとです。`.
