# Usage

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` locally:

```env
FISH_API_KEY=
FISH_REFERENCE_ID=
```

Do not put login email, password, or Story Studio credentials in this project.

## Create A Script

For the default flow:

```bash
cp templates/default-script.yaml script.yaml
```

For the Ochi Masato model flow:

```bash
cp templates/ochi-model-script.yaml script.yaml
```

Edit `script.yaml`, then run:

```bash
npm run generate -- script.yaml --dry-run
npm run generate -- script.yaml --yes
```

## Regenerate One Block

```bash
npm run generate -- script.yaml --only block_004 --force --yes
```

This updates `dist/blocks/block_004.mp3` and rebuilds `dist/master.mp3` from the existing block files.

## Preview Multiple Takes

Create a local ignored preview script:

```bash
cp templates/ochi-model-script.yaml script.preview.yaml
```

Set preview output paths under `dist/previews/...`, then run:

```bash
npm run generate -- script.preview.yaml --blocks-only --force --yes
```

Pick the best take and copy it into the target block before rebuilding or run `--only` after updating `script.yaml`.

## Credit

```bash
npm run credit
```

If credit lookup fails, the CLI prints `unknown` and continues. API keys are never printed.
