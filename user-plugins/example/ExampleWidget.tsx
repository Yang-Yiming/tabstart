import { useState } from 'react'
import { WidgetCard } from '@host/components/WidgetCard'
import type { WidgetProps } from '@host/plugins/types'
import { useWidgetSettings } from '@host/plugins/widgetSettings'

/**
 * 示例插件 —— 复制整个 example 目录即可开始写你自己的插件。
 *
 * 关键点：
 * 1. plugin.tsx 声明元数据与设置 schema（id / name / 尺寸 / settings）。
 * 2. 本组件是渲染逻辑，用 WidgetCard 包裹以保持视觉一致。
 * 3. useWidgetSettings(widgetKey) 读写插件设置（自动持久化到本地存储）。
 * 4. 若要请求远端接口：给 fetch 加上请求头，并在 public/manifest.json
 *    的 host_permissions 里加入对应域名（MV3 扩展需要静态白名单）。
 */
export function ExampleWidget({ widgetKey, compact }: WidgetProps) {
  const resolvedKey = widgetKey ?? 'example'
  const { settings, setSetting } = useWidgetSettings(resolvedKey)
  const [count, setCount] = useState(0)
  const name = String(settings.name ?? 'world')
  const showCount = Boolean(settings.showCount)

  // 请求远端接口的例子（需要对应 host_permissions）：
  // const [data, setData] = useState<unknown>(null)
  // useEffect(() => {
  //   fetch('https://api.example.com/status', {
  //     headers: { Authorization: 'Bearer ' + apiKey },
  //   })
  //     .then((response) => response.json())
  //     .then(setData)
  //     .catch(console.error)
  // }, [])

  return (
    <WidgetCard className={['flex h-full flex-col justify-center gap-3', compact ? 'p-3' : 'p-4'].join(' ')}>
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">Example</div>
      <div className="text-sm text-white/85">Hello, {name}!</div>
      {showCount && (
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="self-start rounded-full bg-white/10 px-3 py-1 text-xs text-white/75 transition hover:bg-white/20 hover:text-white"
        >
          Count: {count}
        </button>
      )}
      <button
        type="button"
        onClick={() => setSetting('name', name === 'world' ? '插件作者' : 'world')}
        className="self-start text-[11px] text-white/40 transition hover:text-white/75"
      >
        切换问候对象（写入设置）
      </button>
    </WidgetCard>
  )
}
