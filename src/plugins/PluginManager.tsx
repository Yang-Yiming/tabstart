import { Layers, Plus, Puzzle, X } from 'lucide-react'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { RevealOnMount } from '../components/RevealOnMount'
import { Toggle } from '../components/Toggle'
import { ThemeSurface } from '../components/ThemeSurface'
import { pluginDescriptors, useEnabledPlugins } from './registry'
import type { HomepagePlugin } from './runtime'

type TabId = 'builtin' | 'external'

/**
 * Plugin manager: lists every registered plugin (built-in + external) with an
 * enable/disable toggle, split into two tabs Obsidian-style, plus instructions
 * for adding new plugins.
 * Plugins live in the repo under src/plugins/<id>/ — no runtime authoring.
 */
export function PluginManager({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('builtin')
  const { isEnabled, setEnabled } = useEnabledPlugins()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const builtins = pluginDescriptors.filter((plugin) => plugin.builtin)
  const external = pluginDescriptors.filter((plugin) => !plugin.builtin)

  const tabs: Array<{ id: TabId; label: string; icon: ReactNode; count: number }> = [
    { id: 'builtin', label: '内置插件', icon: <Layers className="h-4 w-4" />, count: builtins.length },
    { id: 'external', label: '外置插件', icon: <Puzzle className="h-4 w-4" />, count: external.length },
  ]

  return (
    <RevealOnMount className="fixed inset-0 z-50" onClose={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Suspense
        fallback={
          <div className="chrome-panel absolute left-1/2 top-1/2 h-[620px] w-[780px] max-h-[85vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border shadow-2xl" />
        }
      >
            <ThemeSurface
              onClick={(event) => event.stopPropagation()}
              fallbackClassName="chrome-panel"
              className="absolute left-1/2 top-1/2 flex h-[620px] w-[780px] max-h-[85vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border chrome-panel shadow-2xl"
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
                onClick={onClose}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 pb-4 pt-4">
              <div className="flex gap-1 rounded-xl bg-black/30 p-1" role="tablist" aria-label="插件分类">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                        active
                          ? 'bg-white/15 text-white shadow'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/85',
                      ].join(' ')}
                    >
                      {tab.icon}
                      {tab.label}
                      <span
                        className={[
                          'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                          active ? 'bg-white/15 text-white/80' : 'bg-white/10 text-white/50',
                        ].join(' ')}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {activeTab === 'builtin' ? (
                builtins.length > 0 ? (
                  <PluginList plugins={builtins} isEnabled={isEnabled} onToggle={setEnabled} />
                ) : (
                  <EmptyState text="暂无内置插件。" />
                )
              ) : (
                <>
                  {external.length > 0 ? (
                    <PluginList plugins={external} isEnabled={isEnabled} onToggle={setEnabled} />
                  ) : (
                    <EmptyState text="暂无外置插件。" />
                  )}
                  <HowToAdd />
                </>
              )}
            </div>
          </ThemeSurface>
      </Suspense>
    </RevealOnMount>
  )
}

interface PluginListProps {
  plugins: HomepagePlugin[]
  isEnabled: (id: string) => boolean
  onToggle: (id: string, enabled: boolean) => void
}

function PluginList({ plugins, isEnabled, onToggle }: PluginListProps) {
  return (
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
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-10 text-center text-sm text-white/40">
      {text}
    </div>
  )
}

function HowToAdd() {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
      <h4 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/40">
        <Plus className="h-3 w-3" />
        如何新增插件
      </h4>
      <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-white/60">
        <li>
          复制 <code className="rounded bg-white/10 px-1">user-plugins/example/</code> 目录并重命名（如{' '}
          <code className="rounded bg-white/10 px-1">user-plugins/myplugin/</code>）。
        </li>
        <li>
          编辑 <code className="rounded bg-white/10 px-1">plugin.tsx</code>：改 widget 的 id / name /
            尺寸 / settings，并用 <code className="rounded bg-white/10 px-1">defineWidgetPlugin</code> 导出。
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
