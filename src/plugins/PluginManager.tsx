import { Blocks, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toggle } from '../components/Toggle'
import { plugins, useEnabledPlugins } from './registry'
import type { WidgetPlugin } from './types'

/**
 * Plugin manager: lists every registered plugin (built-in + presets) with an
 * enable/disable toggle, plus instructions for adding new plugins.
 * Plugins live in the repo under src/plugins/<id>/ — no runtime authoring.
 */
export function PluginManager() {
  const [open, setOpen] = useState(false)
  const { isEnabled, setEnabled } = useEnabledPlugins()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const builtins = plugins.filter((plugin) => plugin.builtin)
  const userPlugins = plugins.filter((plugin) => !plugin.builtin)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        aria-label="Plugins"
        title="Plugins"
      >
        <Blocks className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute left-1/2 top-1/2 flex max-h-[85vh] w-[560px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h3 className="text-lg font-medium text-white">插件管理器</h3>
                <p className="mt-1 text-xs text-white/50">
                  停用后从网格与添加面板隐藏，布局保留；重新启用即恢复。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
              <PluginList title="插件" plugins={userPlugins} isEnabled={isEnabled} onToggle={setEnabled} />
              <PluginList title="内置组件" plugins={builtins} isEnabled={isEnabled} onToggle={setEnabled} />
              <HowToAdd />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PluginListProps {
  title: string
  plugins: WidgetPlugin[]
  isEnabled: (id: string) => boolean
  onToggle: (id: string, enabled: boolean) => void
}

function PluginList({ title, plugins, isEnabled, onToggle }: PluginListProps) {
  if (plugins.length === 0) return null
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-white/40">{title}</h4>
      <div className="flex flex-col gap-1.5">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
                {plugin.name}
                <span className="rounded-full bg-white/10 px-1.5 py-px font-mono text-[9px] text-white/50">
                  {plugin.id}
                </span>
              </div>
              {plugin.description && (
                <p className="mt-0.5 text-xs leading-5 text-white/50">{plugin.description}</p>
              )}
            </div>
            <Toggle checked={isEnabled(plugin.id)} onChange={(enabled) => onToggle(plugin.id, enabled)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function HowToAdd() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/40">
        <Plus className="h-3 w-3" />
        如何新增插件
      </h4>
      <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-white/60">
        <li>
          复制 <code className="rounded bg-white/10 px-1">src/plugins/example/</code> 目录并重命名（如{' '}
          <code className="rounded bg-white/10 px-1">src/plugins/myplugin/</code>）。
        </li>
        <li>
          编辑 <code className="rounded bg-white/10 px-1">plugin.tsx</code>：改 id / name / 尺寸 / settings。
        </li>
        <li>
          重写组件文件。可用 API：<code className="rounded bg-white/10 px-1">WidgetCard</code>、
          <code className="rounded bg-white/10 px-1">useWidgetSettings</code>、props（widgetKey / preview / compact）。
        </li>
        <li>
          若请求远端接口，在 <code className="rounded bg-white/10 px-1">public/manifest.json</code> 的
          host_permissions 里加上对应域名（MV3 需要静态白名单）。
        </li>
        <li>
          重新 <code className="rounded bg-white/10 px-1">bun run build:extension</code>，插件会自动出现在这里。
        </li>
      </ol>
    </div>
  )
}
