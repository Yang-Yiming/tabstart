import { useLocalStorage } from '../../hooks/useLocalStorage'
import { WidgetCard } from '../../components/WidgetCard'

export function NotesWidget() {
  const [notes, setNotes] = useLocalStorage('homepage-notes', '', { debounceMs: 500 })

  return (
    <WidgetCard className="flex h-full flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
        Quick Notes
      </h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot something down..."
        className="min-h-0 flex-1 resize-none rounded-xl bg-white/10 p-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
      />
      <div className="text-right text-xs text-white/50">{notes.length} chars</div>
    </WidgetCard>
  )
}
