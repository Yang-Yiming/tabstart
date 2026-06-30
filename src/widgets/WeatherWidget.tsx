import { Cloud } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'

export function WeatherWidget() {
  return (
    <WidgetCard className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <Cloud className="h-10 w-10 text-accent dark:text-accent-dark" />
      <div className="text-lg font-medium text-text-primary">Weather</div>
      <p className="text-sm text-text-muted">
        Add an API key in WeatherWidget.tsx to see live conditions.
      </p>
    </WidgetCard>
  )
}
