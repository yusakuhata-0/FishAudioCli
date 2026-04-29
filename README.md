# Fish Audio Story Generator

Fish Audioの自作音声モデルを使って、ブロック単位で音声生成、句読点ごとの無音挿入、キャッシュ、最終結合を行うCLIです。

## Repository Structure

```text
src/        CLI implementation
templates/ Shareable script templates
examples/  Safe example scripts
docs/      Usage and sharing docs
inbox/     Local source drop folder; contents are ignored
音声確認/  User-facing local review outputs; ignored
cache/     Local generated cache; ignored
dist/      Local output audio; ignored
```

For internal GitHub sharing, see [docs/SHARING.md](docs/SHARING.md).

## Setup

```bash
npm install
cp .env.example .env
```

`.env` に以下を設定します。ログインメールアドレスやパスワードは使いません。

```env
FISH_API_KEY=...
FISH_REFERENCE_ID=...
```

## Generate

Create a local script from a template:

```bash
cp templates/default-script.yaml script.yaml
```

For the Ochi Masato custom model workflow:

```bash
cp templates/ochi-model-script.yaml script.yaml
```

Then run:

```bash
npm run generate -- script.yaml
npm run generate -- script.yaml --force
npm run generate -- script.yaml --only block_002
npm run generate -- script.yaml --blocks-only
npm run generate -- script.yaml --dry-run
npm run generate -- script.yaml --yes
npm run credit
```

## Billing / Dry Run

Fish Audio API利用はWeb版Story Studioの生成枠ではなく、従量課金 / pay-as-you-go 前提で扱います。生成前に `--dry-run` で見積もりできます。

```bash
npm run generate -- script.yaml --dry-run
```

表示する内容:

- 総ブロック数
- 新規生成ブロック数
- キャッシュ利用ブロック数
- UTF-8 bytes
- 概算API料金
- API credit
- has_free_credit
- `--force` の有無

料金目安は `s2-pro / s1 = $15 / 1,000,000 UTF-8 bytes` で計算します。日本語は概ね1文字3 bytesですが、実装では `Buffer.byteLength(text, "utf8")` を使います。

APIクレジット残高と無料APIクレジット有無は、生成前に以下のAPIで確認します。

```text
GET https://api.fish.audio/wallet/self/api-credit?check_free_credit=true
```

確認に失敗してもCLI全体は落とさず、`APIクレジット残高確認不可` と表示して処理を続けます。APIキーやAuthorizationヘッダーはログに出しません。

残高だけ確認する場合:

```bash
npm run credit
```

出力:

```text
credit: unknown
has_free_credit: unknown
```

## Cache And Force

同じ条件のブロックは `cache/` の音声を再利用し、APIを呼ばないことで同じブロックの再課金を避けます。

キャッシュキーには以下を含めます。

- `model.name`
- `reference_id`
- `block_id`
- `text`
- `temperature`
- `top_p`
- `speed`
- `format`
- `bitrate`
- `latency`
- `chunk_length`
- `normalize`
- `normalize_loudness`
- `pause` 設定
- `condition_on_previous_chunks`

`--force` を指定すると、キャッシュ済みブロックも再生成します。API課金が再度発生する可能性があるため、CLIは警告を表示します。

`--only block_002` を指定した場合は、そのブロックだけを見積もり・再生成対象にします。

## Text Intake Flow

音声用テキストを受け取ったら、すぐ生成せず以下を確認して `script.yaml` に落とします。

1. 句読点ごとの間
   - `、`: 0.3秒
   - `。`: 0.7秒
   - `！`: 0.8秒
   - `？`: 0.8秒
   - 改行: 1.0秒
   - ブロック間: 1.2秒
2. ブロック分け
   - 空行ベースでよいか
   - 文脈と長さを見て自動分割してよいか
   - 指定の区切り位置があるか
3. 読み上げトーン
   - 自然で落ち着いたナレーション
   - 明るめのプレゼン調
   - 淡々とした読み
   - ゆっくり丁寧
   - スピード感のある読み
   - その他自由指定
4. 読み上げ速度
   - `0.9`: ややゆっくり
   - `1.0`: 標準
   - `1.1`: やや速め
   - `1.2`: 速め
5. 出力形式
   - `mp3 / 192kbps` でよいか
   - `wav` も必要か
6. 読み方指定
   - 固有名詞
   - 英語
   - 数字
   - 記号
   - 読ませたくない箇所
   - 読み替えたい表現

Fish Audioのログインメールアドレス、ログインパスワード、Web版Story Studioのログイン情報は要求しません。認証は `.env` の `FISH_API_KEY` のみです。

## Ochi Masato Model Defaults

For the Ochi Masato model, use [templates/ochi-model-script.yaml](templates/ochi-model-script.yaml) and [docs/OCHI_MODEL_WORKFLOW.md](docs/OCHI_MODEL_WORKFLOW.md).

Key defaults:

- Use `オチまさとです。` for the self-introduction unless the user specifies otherwise.
- Match the web generation settings: high-quality mode on (`latency: balanced`, `chunk_length: 300`), text normalization off (`normalize: false`), loudness normalization on (`normalize_loudness: true`).
- Do not split inside a block by punctuation.
- Set punctuation pauses to `0` and let Fish Audio handle natural Japanese punctuation timing.
- Treat explicit source pauses as block boundaries and encode them with `pause_after`.
- Rewrite unstable readings in the text before generation, e.g. `25%` -> `二十五パーセント`, `YouTube` -> `ユーチューブ`.
- Generate blocks in bulk, keep the good takes, merge them into `master.mp3` as you go, and leave final spacing adjustment to CapCut.
