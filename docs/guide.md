---
tags: [web, cloudflare, obsidian, quartz]
created: 2026-11-20
updated: 2026-11-20
---

# メモ閲覧サイト構想

## 目的

自分のリポジトリにあるMDメモ（Obsidian）を、ブラウザからどこでも読めるメモサイトにする。

## 方針

- **閲覧専用にする。** 編集は手元の Obsidian で行い、サイトは読むためだけに使う。
- **サーバーは持たない。** 静的サイトとして公開する。

## 構成

| 役割 | 使うもの |
| --- | --- |
| サイト生成 | **Quartz**（Obsidian向け。`[[wikilink]]` やバックリンクに対応） |
| ホスティング | **Cloudflare Pages**（push のたびに自動で再ビルド） |
| 更新 | 手元の Obsidian で書いて push（**Obsidian Git** プラグインで自動化も可） |

## 更新の流れ

1. Obsidian でメモを書く。
2. リポジトリに push する。
3. Cloudflare Pages が自動でビルドし、サイトに反映される。

## 閲覧のアクセス制御

**決定：公開する**（ログインなし）。

### 公開する場合

- ログインなしで公開する。いちばん手軽。
- メモの中身が公開しても問題ないものであることが前提。

### 非公開にする場合

- **Cloudflare Access** をかける。
- 許可したアカウント（個人の GitHub や個人メアド）だけがログインして読める。
- セッションの有効期間を長め（1週間〜1か月）にすると、ログインの手間が減る。

## メモ

- リポジトリを公開する場合は、コミットの author を GitHub の noreply アドレスにしておくと、メアドが履歴に出ない。

## 推奨構成まとめ

**Quartz ＋ Cloudflare Pages**（非公開にするなら ＋ Cloudflare Access）

## 運用

### 何を公開するか

- コピー元は `~/.obsidian/USD`（`~` はホームフォルダー）。設定は `sync.config.json`。
- Vault をそのままリポジトリにはしない。`scripts/sync-notes.mjs` が、コピー元を `content/` にコピーする（毎回作り直すので、`content/` は直接編集しない）。
- **公開しないフォルダー**は `sync.config.json` の `ignoreFolders` に名前を足す。どの階層にあっても除外される。いまは `_Old`。
- ファイル単位で除外したいときは `ignoreFiles` にファイル名を書く。
- コピー元に `index.md` が無ければ、メモ一覧のトップページを自動で作る。

### 更新の流れ（実際の手順）

1. Obsidian でメモを書く。
2. `node scripts/publish.mjs` を実行する（同期 → `content/` だけ commit → push）。
3. Cloudflare（Workers）が自動でビルドし、サイトに反映される。

### 手元で確認する

```powershell
node scripts/sync-notes.mjs
npx quartz build --serve
```

<http://localhost:8080> で見られる。

### デザイン

- `ui-mockup.html` に寄せている。
- レイアウト（上部バー・左右のサイドバー・前後のメモ）：`quartz/components/frames/NotesFrame.tsx`。`quartz.ts` で登録し、`quartz.config.yaml` の `layout.byPageType.*.template: notes` で使う。
- 色とフォント：`quartz.config.yaml` の `theme`。
- 細かい見た目：`quartz/styles/custom.scss`。

### Cloudflare の設定

- 公開先：<https://usd-notes.kurama0724.workers.dev/>（Cloudflare **Workers** の静的アセットとして配信。GitHub の `main` に push すると自動でビルド）
- 配信の設定は `wrangler.jsonc`（出力先 `public/`、無いページは `404.html`）。
- ダッシュボード側のビルドコマンドは次のとおりにしておく。

| 項目 | 値 |
| --- | --- |
| Production branch | `main` |
| Build command | `git fetch --unshallow && npx quartz plugin install && npx quartz build` |
| Deploy command | `npx wrangler deploy` |

- Node のバージョンは `.node-version` から読まれる。
- `git fetch --unshallow` は、更新日を git の履歴から取るため。

### Quartz の更新

- Quartz 本体は `upstream`（jackyzha0/quartz の v5）から `npx quartz upgrade` で取り込む。
- Quartz 付属の `docs/`（Quartz 自身のドキュメント）は消してある。upgrade で `docs/` の衝突が出たら、消す側（`git rm`）で解決する。
