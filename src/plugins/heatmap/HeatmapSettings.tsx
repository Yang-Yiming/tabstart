import { useState } from 'react'
import { Check, Minus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useActivityStore } from '../_shared/activity'

/**
 * Settings UI for the Heatmap widget, rendered inside Settings → Widgets.
 * Manages topics and their per-topic daily goals from the shared activity
 * store, so changes apply to every Heatmap/Streak widget instantly.
 */
export function HeatmapSettings() {
  const [store, setStore] = useActivityStore()
  const [adding, setAdding] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const setGoal = (topic: string, value: number) => {
    setStore((prev) => ({
      ...prev,
      goals: { ...prev.goals, [topic]: Math.max(0, value) },
    }))
  }

  const addTopic = () => {
    const name = newTopic.trim()
    if (!name || store.topics.includes(name)) return
    setStore((prev) => ({ ...prev, topics: [...prev.topics, name] }))
    setNewTopic('')
    setAdding(false)
    setJustAdded(name)
    window.setTimeout(() => setJustAdded(null), 600)
  }

  const startEditing = (topic: string) => {
    setEditing(topic)
    setEditValue(topic)
    setAdding(false)
  }

  const cancelEditing = () => {
    setEditing(null)
    setEditValue('')
  }

  const renameTopic = (oldName: string) => {
    const name = editValue.trim()
    if (!name || name === oldName) {
      cancelEditing()
      return
    }
    if (store.topics.includes(name)) {
      // Keep the input open so the user can pick another name.
      return
    }
    setStore((prev) => {
      const topics = prev.topics.map((t) => (t === oldName ? name : t))
      const data = { ...prev.data }
      const goals = { ...prev.goals }
      if (data[oldName] !== undefined) {
        data[name] = data[oldName]
        delete data[oldName]
      }
      if (goals[oldName] !== undefined) {
        goals[name] = goals[oldName]
        delete goals[oldName]
      }
      return { topics, data, goals }
    })
    setJustAdded(name)
    window.setTimeout(() => setJustAdded(null), 600)
    cancelEditing()
  }

  const removeTopic = (topic: string) => {
    if (!window.confirm(`Delete topic "${topic}"?`)) return
    setStore((prev) => {
      const topics = prev.topics.filter((t) => t !== topic)
      const data = { ...prev.data }
      const goals = { ...prev.goals }
      delete data[topic]
      delete goals[topic]
      return { topics, data, goals }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-medium text-white">活动主题</h4>
        <p className="mt-1 text-xs text-white/50">管理活动主题，并为每个主题设置每日目标。</p>
      </div>

      <div className="space-y-2">
        {store.topics.map((topic) => (
          <div
            key={topic}
            className={[
              'flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition',
              justAdded === topic ? 'border-white/30 bg-white/10' : '',
            ].join(' ')}
          >
            {editing === topic ? (
              <div className="flex w-full items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameTopic(topic)
                    if (e.key === 'Escape') cancelEditing()
                  }}
                  autoFocus
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-white/25 focus:outline-none"
                  aria-label={`Rename ${topic}`}
                />
                <button
                  type="button"
                  onClick={() => renameTopic(topic)}
                  disabled={!editValue.trim()}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Confirm rename"
                  title="确认重命名"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cancel rename"
                  title="取消"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="truncate text-sm text-white/85">{topic}</span>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
                    <button
                      type="button"
                      onClick={() => setGoal(topic, (store.goals[topic] ?? 0) - 1)}
                      className="grid h-6 w-6 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Decrease ${topic} goal`}
                      title="Decrease goal"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={store.goals[topic] || ''}
                      placeholder="--"
                      onChange={(e) => setGoal(topic, Number(e.target.value) || 0)}
                      className="w-10 bg-transparent text-center font-mono text-xs text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label={`${topic} daily goal`}
                    />
                    <button
                      type="button"
                      onClick={() => setGoal(topic, (store.goals[topic] ?? 0) + 1)}
                      className="grid h-6 w-6 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Increase ${topic} goal`}
                      title="Increase goal"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEditing(topic)}
                    className="grid h-7 w-7 place-items-center rounded-md text-white/35 transition hover:bg-white/10 hover:text-white"
                    aria-label={`Rename ${topic}`}
                    title={`重命名 ${topic}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeTopic(topic)}
                    className="grid h-7 w-7 place-items-center rounded-md text-white/35 transition hover:bg-red-400/10 hover:text-red-200"
                    aria-label={`Delete ${topic}`}
                    title={`Delete ${topic}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {store.topics.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-white/40">
            还没有主题，先添加一个吧。
          </p>
        )}
      </div>

      {adding ? (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTopic()
              if (e.key === 'Escape') {
                setAdding(false)
                setNewTopic('')
              }
            }}
            placeholder="新主题名称..."
            autoFocus
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/25 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setNewTopic('')
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
              取消
            </button>
            <button
              type="button"
              onClick={addTopic}
              disabled={!newTopic.trim()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              添加主题
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAdding(true)
            setEditing(null)
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2 text-sm font-medium text-white/55 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          添加主题
        </button>
      )}
    </div>
  )
}
