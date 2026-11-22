// メモを同期して、GitHub に push する（push すると Cloudflare Pages が自動でビルドする）。
//   node scripts/publish.mjs
// content/ 以外の変更（設定やデザイン）は含めない。それらは普段どおり git で commit する。

import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", ...opts })
const out = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: "utf8" })

run(process.execPath, [path.join(root, "scripts", "sync-notes.mjs")])

run("git", ["add", "--all", "content"])
if (out("git", ["diff", "--cached", "--name-only", "--", "content"]).trim() === "") {
  console.log("メモに変更はありません。")
  process.exit(0)
}

const stamp = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date())
run("git", ["commit", "-m", `notes: 同期 ${stamp}`, "--", "content"])
run("git", ["push"])
console.log("push しました。数分で Cloudflare Pages に反映されます。")
