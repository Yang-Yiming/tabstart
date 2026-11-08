import { ClockWidget } from '../../widgets/ClockWidget'
import { SearchWidget } from '../../widgets/SearchWidget'
import type { HomepageContext, HomepagePlugin } from '../runtime'
import type { SlotDescriptor } from '../types'

function defineSlotPlugin(slot: SlotDescriptor): HomepagePlugin {
  return {
    id: slot.id,
    name: slot.label ? String(slot.label) : slot.id,
    description: slot.description,
    builtin: true,
    order: slot.order,
    apply(ctx: HomepageContext) {
      ctx.effect(() => ctx.slots.register(slot))
    },
  }
}

export const plugins = [
  defineSlotPlugin({
    id: 'hero-clock',
    slot: 'hero.clock',
    component: ClockWidget,
    label: 'Clock',
    description: '显示当前时间与日期。',
    order: 10,
  }),
  defineSlotPlugin({
    id: 'hero-search',
    slot: 'hero.search',
    component: SearchWidget,
    label: 'Search',
    description: '在当前标签页快速搜索或打开网址。',
    order: 20,
  }),
]
