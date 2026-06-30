import { useLocalStorage } from '../hooks/useLocalStorage'
import { WidgetCard } from '../components/WidgetCard'

export function NotesWidget() {
  const [notes, setNotes] = useLocalStorage('homepage-notes', '')

  return (
    <WidgetCard className="flex h-full flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
        Quick Notes
      </h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot something down..."
        className="min-h-0 flex-1 resize-none rounded-xl bg-panel-highlight p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none dark:bg-panel-highlight-dark"
      />
      <div className="text-right text-xs text-text-muted">{notes.length} chars</div>
    </WidgetCard>
  )
}
