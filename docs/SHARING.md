# GitHub Sharing Guide

## Commit

Commit:

- `src/`
- `docs/`
- `templates/`
- `examples/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `README.md`
- `AGENTS.md`
- `.env.example`
- `.gitignore`
- `inbox/.gitkeep`

## Do Not Commit

Do not commit:

- `.env`
- `.env.*` except `.env.example`
- `script.yaml`
- `script.*.yaml`
- `inbox/*` except `inbox/.gitkeep`
- `cache/`
- `dist/`
- `build/`
- `node_modules/`
- API keys, credentials, generated audio, or customer/source assets

## Local Project Files

Each user should create their own local `script.yaml` from `templates/`.

For source files from screenshots, docs, or drafts, put them in `inbox/` locally. `inbox/` contents are ignored so sensitive source material does not get pushed.

## Recommended First Commands

```bash
npm install
cp .env.example .env
npm run credit
cp templates/ochi-model-script.yaml script.yaml
npm run generate -- script.yaml --dry-run
```
