import { lazy } from 'react'
import type { WidgetPlugin } from '../types'

const plugin: WidgetPlugin = {
  id: 'example',
  name: 'Example Plugin',
  group: 'Plugins',
  description: '插件模板：复制本目录、改 id / name、重写组件，重新 build 即生效。',
  component: lazy(() => import('./ExampleWidget').then((m) => ({ default: m.ExampleWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 1,
  minH: 1,
  order: 110,
  settings: {
    title: 'Example Plugin',
    description: '演示插件设置的读写。',
    fields: [
      {
        type: 'text',
        key: 'name',
        label: '问候对象',
        description: '展示在卡片上的名字。',
        default: 'world',
      },
      {
        type: 'boolean',
        key: 'showCount',
        label: '显示计数器',
        default: true,
      },
    ],
  },
}

export default plugin
