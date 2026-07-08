import { Palette, Settings, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { MouseHaloConfig, ShineConfig } from '../config/mouseHalo'
import { defaultShineConfig } from '../config/mouseHalo'

interface SettingsPanelProps {
  haloConfig: MouseHaloConfig
  onHaloChange: (config: MouseHaloConfig) => void
}

interface Category {
  id: string
  name: string
  icon: ReactNode
}

const blendModeLabels: Record<MouseHaloConfig['blendMode'], string> = {
  normal: '正常',
  screen: '滤色',
  overlay: '叠加',
  'soft-light': '柔光',
  'color-dodge': '颜色减淡',
}

export function SettingsPanel({ haloConfig, onHaloChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [haloExpanded, setHaloExpanded] = useState(false)

  const shine = haloConfig.shine ?? defaultShineConfig

  const categories: Category[] = [
    { id: 'appearance', name: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  ]

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const update = (patch: Partial<MouseHaloConfig>) => {
    onHaloChange({ ...haloConfig, ...patch })
  }

  const updateShine = (patch: Partial<ShineConfig>) => {
    update({ shine: { ...shine, ...patch } })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        aria-label="Settings"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 top-1/2 flex w-[720px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-2xl"
          >
            <div className="w-44 shrink-0 border-r border-white/10 bg-black/30 p-4">
              <h2 className="mb-4 px-2 text-sm font-semibold text-white">Settings</h2>
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
                  >
                    {cat.icon}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[420px] flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <h3 className="text-lg font-medium text-white">Appearance</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto p-6">

                {/* Widget Shine */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-white/60" />
                    <h4 className="text-sm font-medium text-white">Widget 光效</h4>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-white/80">启用 Widget 光泽</span>
                    <input
                      type="checkbox"
                      checked={shine.enabled}
                      onChange={(e) => updateShine({ enabled: e.target.checked })}
                      className="h-4 w-4 accent-white/80"
                    />
                  </label>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-white/60">
                      <span>透明度</span>
                      <span>{Math.round(shine.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={Math.round(shine.opacity * 100)}
                      onChange={(e) => updateShine({ opacity: Number(e.target.value) / 100 })}
                      className="halo-range w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-white/60">颜色</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shine.color}
                        onChange={(e) => updateShine({ color: e.target.value })}
                        className="h-8 w-8 cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-transparent p-0"
                      />
                      <span className="text-xs text-white/60">{shine.color}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Mouse Halo (collapsible) */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setHaloExpanded((v) => !v)}
                    className="flex w-full items-center gap-2"
                  >
                    <svg
                      className="h-4 w-4 text-white/60 transition-transform duration-200"
                      style={{ transform: haloExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <h4 className="text-sm font-medium text-white">光标光晕</h4>
                  </button>

                  {haloExpanded && (
                    <>
                      <label className="flex cursor-pointer items-center justify-between">
                        <span className="text-sm text-white/80">启用光标光晕</span>
                        <input
                          type="checkbox"
                          checked={haloConfig.enabled}
                          onChange={(e) => update({ enabled: e.target.checked })}
                          className="h-4 w-4 accent-white/80"
                        />
                      </label>

                      <div>
                        <div className="mb-1 flex justify-between text-xs text-white/60">
                          <span>大小</span>
                          <span>{haloConfig.size}px</span>
                        </div>
                        <input
                          type="range"
                          min={80}
                          max={800}
                          step={10}
                          value={haloConfig.size}
                          onChange={(e) => update({ size: Number(e.target.value) })}
                          className="halo-range w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs text-white/60">
                          <span>透明度</span>
                          <span>{Math.round(haloConfig.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(haloConfig.opacity * 100)}
                          onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
                          className="halo-range w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs text-white/60">
                          <span>模糊</span>
                          <span>{haloConfig.blur}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={120}
                          step={1}
                          value={haloConfig.blur}
                          onChange={(e) => update({ blur: Number(e.target.value) })}
                          className="halo-range w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs text-white/60">
                          <span>跟随平滑度</span>
                          <span>{Math.round(haloConfig.smooth * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          value={Math.round(haloConfig.smooth * 100)}
                          onChange={(e) => update({ smooth: Number(e.target.value) / 100 })}
                          className="halo-range w-full"
                        />
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-white/60">混合模式</div>
                        <select
                          value={haloConfig.blendMode}
                          onChange={(e) => update({ blendMode: e.target.value as MouseHaloConfig['blendMode'] })}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                        >
                          {Object.entries(blendModeLabels).map(([value, label]) => (
                            <option key={value} value={value} className="bg-black/90 text-white">
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-white/60">颜色</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={haloConfig.color}
                            onChange={(e) => update({ color: e.target.value })}
                            className="h-8 w-8 cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-transparent p-0"
                          />
                          <span className="text-xs text-white/60">{haloConfig.color}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
