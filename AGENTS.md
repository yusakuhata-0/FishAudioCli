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
- Treat explicit visual/source pauses as block boundaries and encode them with `pause_after`.
- For unnatural English or symbol readings, rewrite in Japanese phonetic form in `text`.
  - Example: `YouTube` -> `ユーチューブ`
  - Example: `25%` -> `二十五パーセント`

## Generation Workflow

1. Put source assets in `inbox/` locally.
2. Convert the source into a local `script.yaml` from a template.
3. Run `npm run generate -- script.yaml --dry-run`.
4. If the estimate is acceptable, run `npm run generate -- script.yaml --yes`.
5. For quality fixes, regenerate only affected blocks with `--only block_id`.
6. If testing multiple takes for one phrase, write preview scripts under local ignored `script.*.yaml` and output under `dist/previews/`.

## Shareable Files

Commit source code, docs, templates, examples, `.env.example`, and `inbox/.gitkeep`.

Do not commit local `.env`, `script.yaml`, `script.*.yaml`, `inbox/*`, `cache/`, `dist/`, `build/`, or `node_modules/`.
