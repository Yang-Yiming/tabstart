import type { WidgetSettingField } from '../widgets/types'
import { Toggle } from './Toggle'

interface SettingFieldProps {
  field: WidgetSettingField
  value: unknown
  onChange: (value: boolean | string | number) => void
}

const controlClass =
  'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition focus:border-white/25'

export function SettingField({ field, value, onChange }: SettingFieldProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <h5 className="text-sm font-medium text-white">{field.label}</h5>
        {field.description && <p className="mt-0.5 text-xs leading-5 text-white/50">{field.description}</p>}
      </div>
      {field.type === 'boolean' && <Toggle checked={Boolean(value)} onChange={onChange} />}
      {field.type === 'select' && (
        <select
          value={String(value ?? field.default)}
          onChange={(event) => onChange(event.target.value)}
          className={controlClass}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {field.type === 'number' && (
        <input
          type="number"
          value={Number(value ?? field.default)}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => onChange(event.target.valueAsNumber)}
          className={`${controlClass} w-24 text-right`}
        />
      )}
      {field.type === 'text' && (
        <input
          type="text"
          value={String(value ?? field.default)}
          onChange={(event) => onChange(event.target.value)}
          className={`${controlClass} w-48`}
        />
      )}
    </div>
  )
}
