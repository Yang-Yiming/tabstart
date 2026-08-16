interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-[var(--toggle-on)]' : 'bg-[var(--toggle-off)]',
      ].join(' ')}
    >
      <span
        className={[
          'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
