import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { frameRegistry } from "./quartz/components/frames/registry"
import { NotesFrame } from "./quartz/components/frames/NotesFrame"

// このサイト独自のページ枠（ui-mockup.html のレイアウト）。
// quartz.config.yaml の layout.byPageType.<type>.template: notes で使う。
frameRegistry.register(NotesFrame.name, NotesFrame, "site")

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
