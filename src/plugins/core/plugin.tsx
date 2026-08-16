import { ClockWidget } from '../../widgets/ClockWidget'
import { SearchWidget } from '../../widgets/SearchWidget'
import type { HomepageContext, HomepagePlugin } from '../runtime'
import type { SlotDescriptor } from '../types'

function defineSlotPlugin(slot: SlotDescriptor): HomepagePlugin {
  return {
    id: slot.id,
    name: slot.label ? String(slot.label) : slot.id,
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
    order: 10,
  }),
  defineSlotPlugin({
    id: 'hero-search',
    slot: 'hero.search',
    component: SearchWidget,
    label: 'Search',
    order: 20,
  }),
]
