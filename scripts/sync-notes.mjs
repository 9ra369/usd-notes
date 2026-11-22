// Obsidian Vault の指定フォルダーを content/ にコピーする。
// 設定は sync.config.json:
//   source        コピー元（Obsidian のフォルダー）
//   target        コピー先（Quartz の content フォルダー）
//   ignoreFolders この名前のフォルダーは、どの階層にあってもコピーしない
//   ignoreFiles   この名前のファイルはコピーしない
// content/ はこのスクリプトが毎回作り直すので、直接編集しないこと。

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const config = JSON.parse(fs.readFileSync(path.join(root, "sync.config.json"), "utf8"))

// "~" はホームフォルダー（例: C:/Users/<ユーザー名>）
const source = path.resolve(config.source.replace(/^~(?=$|[\\/])/, os.homedir()))
const target = path.resolve(root, config.target ?? "content")
const ignoreFolders = new Set(config.ignoreFolders ?? [])
const ignoreFiles = new Set(config.ignoreFiles ?? [])

if (!fs.existsSync(source)) {
  console.error(`コピー元が見つかりません: ${source}`)
  process.exit(1)
}
// 安全確認: 消すのはプロジェクト内の content だけ
if (!target.startsWith(root + path.sep) || target === source) {
  console.error(`コピー先がプロジェクトの外を指しています: ${target}`)
  process.exit(1)
}

fs.rmSync(target, { recursive: true, force: true })
fs.mkdirSync(target, { recursive: true })

const copied = []
const skipped = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, entry.name)
    const rel = path.relative(source, from)
    // ドットで始まるもの（.obsidian, .gitignore など）は常に除外
    if (entry.name.startsWith(".")) continue
    if (entry.isDirectory()) {
      if (ignoreFolders.has(entry.name)) {
        skipped.push(rel + "/")
        continue
      }
      walk(from)
    } else if (entry.isFile()) {
      if (ignoreFiles.has(entry.name)) {
        skipped.push(rel)
        continue
      }
      const to = path.join(target, rel)
      fs.mkdirSync(path.dirname(to), { recursive: true })
      fs.copyFileSync(from, to)
      // 更新日時を元ファイルに合わせる（手元でプレビューしたときの「更新」日）
      const st = fs.statSync(from)
      fs.utimesSync(to, st.atime, st.mtime)
      copied.push(rel)
    }
  }
}
walk(source)

// トップページ。コピー元に index.md が無ければ、メモの一覧を自動で作る。
if (!fs.existsSync(path.join(target, "index.md"))) {
  const notes = copied
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.split(path.sep).join("/"))
    .sort((a, b) => a.localeCompare(b, "ja"))
  const groups = new Map()
  for (const f of notes) {
    const dir = f.includes("/") ? f.slice(0, f.lastIndexOf("/")) : ""
    if (!groups.has(dir)) groups.set(dir, [])
    groups.get(dir).push(f)
  }
  const lines = ["---", "title: USD ノート", "---", "", "OpenUSD の学習メモ。", ""]
  for (const [dir, files] of [...groups].sort(([a], [b]) =>
    a === "" ? -1 : b === "" ? 1 : a.localeCompare(b, "ja"),
  )) {
    if (dir) lines.push(`## ${dir}`, "")
    for (const f of files)
      lines.push(`- [[${f.replace(/\.md$/, "")}|${path.posix.basename(f, ".md")}]]`)
    lines.push("")
  }
  fs.writeFileSync(path.join(target, "index.md"), lines.join("\n"))
}

console.log(`コピー元: ${source}`)
console.log(`コピーした: ${copied.length} ファイル`)
if (skipped.length) console.log(`除外した: ${skipped.join(", ")}`)
