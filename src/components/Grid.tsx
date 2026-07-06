import { widgetRegistry } from '../widgets/registry'
import { homepageConfig } from '../config/homepage'

export function Grid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
      {homepageConfig.widgets.map((widget) => {
        const Component = widgetRegistry[widget.id]
        if (!Component) return null

        const colSpan = widget.columnSpan ?? 1
        const rowSpan = widget.rowSpan ?? 1

        return (
          <div
            key={widget.id}
            className={[
              `col-span-1`,
              colSpan >= 2 && 'sm:col-span-2',
              colSpan >= 3 && 'lg:col-span-3',
              colSpan >= 4 && 'lg:col-span-4',
              rowSpan >= 2 && 'row-span-2',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Component />
          </div>
        )
      })}
    </div>
  )
}
