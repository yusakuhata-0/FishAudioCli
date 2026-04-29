# Repository Instructions

## Scope

These instructions apply to this Fish Audio Story Generator repository.

## Security

- Never read, print, commit, or summarize `.env` contents.
- Never ask for Fish Audio login email, login password, or Story Studio credentials.
- Use only `FISH_API_KEY` and `FISH_REFERENCE_ID` from `.env`.
- Do not include generated audio, cache files, inbox files, or local `script.yaml` files in Git.

## Ochi Model Defaults

When using the Ochi Masato voice model:

- Prefer `templates/ochi-model-script.yaml` as the starting point.
- Use `オチまさとです。` for the self-introduction unless the user specifies otherwise.
- Do not split inside a block by punctuation for this model.
- Set punctuation pauses to `0` and let Fish Audio handle natural Japanese punctuation timing.
- Match the web generation defaults: high-quality mode on (`latency: balanced`, `chunk_length: 300`), text normalization off (`normalize: false`), loudness normalization on (`normalize_loudness: true`).
- Treat explicit visual/source pauses as block boundaries and encode them with `pause_after`.
- For unnatural English or symbol readings, rewrite in Japanese phonetic form in `text`.
  - Example: `YouTube` -> `ユーチューブ`
  - Example: `25%` -> `二十五パーセント`
- If the user provides a polished/final script, do not rewrite wording, kanji/kana, numbers, symbols, or readings without asking first.
- Put user-facing review outputs in shallow Japanese-named folders under `音声確認/` when practical.

## Generation Workflow

1. Put source assets in `inbox/` locally.
2. Convert the source into a local `script.yaml` from a template.
3. Run `npm run generate -- script.yaml --dry-run`.
4. If the estimate is acceptable, run `npm run generate -- script.yaml --yes`.
5. For quality fixes, regenerate only affected blocks with `--only block_id`.
6. If testing multiple takes for one phrase, write preview scripts under local ignored `script.*.yaml` and put user-facing takes under `音声確認/`.

## Shareable Files

Commit source code, docs, templates, examples, `.env.example`, and `inbox/.gitkeep`.

Do not commit local `.env`, `script.yaml`, `script.*.yaml`, `inbox/*`, `音声確認/`, `cache/`, `dist/`, `build/`, or `node_modules/`.
