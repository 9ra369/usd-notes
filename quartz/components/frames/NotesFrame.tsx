import { PageFrame, PageFrameProps } from "./types"
import { QuartzPluginData } from "../../plugins/vfile"
import { QuartzComponentProps } from "../types"
import { FullSlug, resolveRelative, slugTag } from "../../util/path"

/**
 * ui-mockup.html に合わせたページ枠（このサイト独自）。
 *
 *   ┌──────────── topbar（ロゴ・検索・最終ビルド日）────────────┐
 *   │ left（EXPLORER・TAGS） │ center（記事）     │ right（目次・グラフ・バックリンク）│
 *   └───────────────────────── footer ─────────────────────────┘
 *
 * 見た目は quartz/styles/custom.scss の `.page[data-frame="notes"]` に書いてある。
 * quartz.config.yaml の layout.byPageType.<type>.template: notes で使う。
 */

const docIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M5 3h10l4 4v14H5z"></path>
    <path d="M15 3v4h4"></path>
    <path d="M8.5 12h7M8.5 16h5"></path>
  </svg>
)

const ymd = (d: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)

/** content/ からの相対パス（例: "Structure/01_usd-library-layers.md"） */
function relPath(f: QuartzPluginData): string {
  const p = (f.relativePath ?? f.filePath ?? "") as string
  return p.replace(/\\/g, "/").replace(/^content\//, "")
}

/** 記事として数えるページか（トップページ・フォルダー・タグのページは除く） */
function isNote(f: QuartzPluginData): boolean {
  const slug = (f.slug ?? "") as string
  return relPath(f).endsWith(".md") && slug !== "index" && !slug.endsWith("/index")
}

const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" })

/** EXPLORER と同じ並び（各階層でフォルダーが先、あとは名前順） */
function explorerOrder(a: QuartzPluginData, b: QuartzPluginData): number {
  const sa = relPath(a).split("/")
  const sb = relPath(b).split("/")
  const n = Math.min(sa.length, sb.length)
  for (let i = 0; i < n; i++) {
    const aIsFile = i === sa.length - 1
    const bIsFile = i === sb.length - 1
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1
    const ka = aIsFile ? String(a.frontmatter?.title ?? sa[i]) : sa[i]
    const kb = bIsFile ? String(b.frontmatter?.title ?? sb[i]) : sb[i]
    const c = collator.compare(ka, kb)
    if (c !== 0) return c
  }
  return sa.length - sb.length
}

type HNode = { type: string; tagName?: string; value?: string; children?: HNode[] }
const textOf = (n: HNode): string =>
  n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(textOf).join("")

/**
 * 本文の先頭が「# ページタイトル」なら取り除いた木を返す（タイトルが2回並ぶのを防ぐ）。
 * 見出しの文言がタイトルと違うときは、そのまま残す。
 */
function dedupeTitle(props: QuartzComponentProps): QuartzComponentProps {
  const root = props.tree as unknown as HNode
  const title = props.fileData.frontmatter?.title
  if (!root?.children || typeof title !== "string") return props
  const i = root.children.findIndex((c) => c.type === "element")
  const first = root.children[i]
  if (i < 0 || first.tagName !== "h1" || textOf(first).trim() !== title.trim()) return props
  const tree = { ...root, children: root.children.filter((_, j) => j !== i) }
  // 目次からも同じ見出しを外す
  const toc = props.fileData.toc
  const k = toc?.findIndex((e) => e.depth === 0 && e.text.trim() === title.trim()) ?? -1
  const fileData =
    k >= 0 ? { ...props.fileData, toc: toc!.filter((_, j) => j !== k) } : props.fileData
  return { ...props, tree: tree as any, fileData }
}

function tagsOf(f: QuartzPluginData): string[] {
  const t = f.frontmatter?.tags
  return Array.isArray(t) ? t.map(String) : []
}

export const NotesFrame: PageFrame = {
  name: "notes",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer,
    sidebars,
  }: PageFrameProps) {
    const here = isNote(componentData.fileData)
    const props = here ? dedupeTitle(componentData) : componentData
    const { fileData, allFiles, cfg } = props
    const slug = fileData.slug as FullSlug

    // サイト全体のタグ（多い順）
    const tagCount = new Map<string, number>()
    for (const f of allFiles) {
      for (const t of tagsOf(f)) {
        const key = slugTag(t)
        tagCount.set(key, (tagCount.get(key) ?? 0) + 1)
      }
    }
    const allTags = [...tagCount].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0]))

    // 前のメモ・次のメモ
    const notes = allFiles.filter(isNote).sort(explorerOrder)
    const idx = here ? notes.findIndex((f) => f.slug === slug) : -1
    const prev = idx > 0 ? notes[idx - 1] : undefined
    const next = idx >= 0 && idx < notes.length - 1 ? notes[idx + 1] : undefined

    const dates = fileData.dates as { created?: Date; modified?: Date } | undefined
    const pageTags = tagsOf(fileData)

    return (
      <>
        <div class="nf-topbar">
          <a class="nf-logo" href={resolveRelative(slug, "index" as FullSlug)}>
            {docIcon}
            <span>{cfg.pageTitle}</span>
          </a>
          {header.map((HeaderComponent) => (
            <HeaderComponent {...props} />
          ))}
          <div class="nf-build">最終ビルド {ymd(new Date())}</div>
        </div>
        <div class="left sidebar" data-sidebar-mode={sidebars?.left ?? "fit"}>
          {left.map((BodyComponent) => (
            <BodyComponent {...props} />
          ))}
          {allTags.length > 0 && (
            <div class="nf-tags">
              <div class="nf-label">TAGS</div>
              <div class="nf-tag-cloud">
                {allTags.map(([tag]) => (
                  <a class="nf-tag" href={resolveRelative(slug, `tags/${tag}` as FullSlug)}>
                    #{tag}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div class="center">
          <div class="page-header">
            <div class="popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...props} />
              ))}
              {here && (
                <div class="nf-meta">
                  {dates?.created && <span>作成 {ymd(dates.created)}</span>}
                  {dates?.modified && <span>更新 {ymd(dates.modified)}</span>}
                  {pageTags.length > 0 && (
                    <span class="nf-meta-tags">
                      {pageTags.map((t) => (
                        <a
                          class="internal tag-link"
                          href={resolveRelative(slug, `tags/${slugTag(t)}` as FullSlug)}
                        >
                          {t}
                        </a>
                      ))}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Content {...props} />
          {(prev || next) && (
            <nav class="nf-pager" aria-label="前後のメモ">
              {prev ? (
                <a class="internal nf-prev" href={resolveRelative(slug, prev.slug as FullSlug)}>
                  <span class="nf-pager-label">前のメモ</span>
                  <span class="nf-pager-title">{prev.frontmatter?.title}</span>
                </a>
              ) : (
                <span />
              )}
              {next && (
                <a class="internal nf-next" href={resolveRelative(slug, next.slug as FullSlug)}>
                  <span class="nf-pager-label">次のメモ</span>
                  <span class="nf-pager-title">{next.frontmatter?.title}</span>
                </a>
              )}
            </nav>
          )}
          <div class="page-footer">
            {afterBody.map((BodyComponent) => (
              <BodyComponent {...props} />
            ))}
          </div>
        </div>
        <div class="right sidebar" data-sidebar-mode={sidebars?.right ?? "fit"}>
          {right.map((BodyComponent) => (
            <BodyComponent {...props} />
          ))}
        </div>
        {footer.map((FooterComponent) => (
          <FooterComponent {...props} />
        ))}
      </>
    )
  },
}
