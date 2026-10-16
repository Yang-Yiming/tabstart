import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { storageArea } from '../lib/storage'
import { usePluginHost } from './hooks'
import { canonicalKey, legacyKeysFor } from './registry'
import type { WidgetSettingValue, WidgetSettingsSchema } from './types'

export const WIDGET_SETTINGS_KEY = 'homepage-widget-settings-v1'

export type WidgetSettings = Record<string, WidgetSettingValue>
export type WidgetSettingsState = Record<string, WidgetSettings>

export type { WidgetSettingValue } from './types'

function widgetSettingsDefaults(schema: WidgetSettingsSchema | null): WidgetSettings {
  if (!schema) return {}
  return Object.fromEntries(schema.fields.map((field) => [field.key, field.default]))
}

/* ------------------------------------------------------------------ */
/* Shared settings store                                               */
/* ------------------------------------------------------------------ */

/**
 * Widget settings live in one storage key (`homepage-widget-settings-v1`), a
 * map from plugin id to that plugin's settings. Reading that map through
 * `useLocalStorage` made every `useWidgetSettings` consumer subscribe to the
 * whole map, so a single keystroke in one widget replaced the map and
 * re-rendered *every* widget. Debouncing the write only delayed that, because
 * the peer-sync event still carried a brand-new map.
 *
 * Instead the map is owned by this small module-level store and exposed
 * through a per-plugin selector: `subscribe` notifies all consumers, but each
 * one re-reads only its own slice and, when that slice is untouched, gets the
 * same object reference back — so React's `useSyncExternalStore` bails out.
 * The map is still serialized to the same key, still debounced, and legacy
 * keys (see `legacyKeysFor`) still resolve.
 */
const WRITE_DEBOUNCE_MS = 300

let state: WidgetSettingsState = {}
let hydrateStarted = false
let writeTimer: number | null = null
let flushListenerInstalled = false

const listeners = new Set<() => void>()
/** Raw slice per widget key; cleared on change so only changed slices get new identities. */
const sliceCache = new Map<string, WidgetSettings | undefined>()

function notify() {
  sliceCache.clear()
  listeners.forEach((listener) => listener())
}

function hydrate() {
  if (hydrateStarted || typeof window === 'undefined') return
  hydrateStarted = true
  storageArea
    .get<WidgetSettingsState>(WIDGET_SETTINGS_KEY)
    .then((value) => {
      if (value && typeof value === 'object') state = value
      notify()
    })
    .catch(() => notify())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  hydrate()
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Stored settings for a plugin, falling back to legacy keys that migrate
 * into this plugin id (e.g. `gauge:deepseek-balance` → `deepseek`) so old
 * data applies even before the one-time storage migration runs.
 */
function readSlice(widgetKey: string): WidgetSettings | undefined {
  if (sliceCache.has(widgetKey)) return sliceCache.get(widgetKey)
  const canonical = canonicalKey(widgetKey)
  let value = state[canonical]
  if (value === undefined) {
    for (const legacy of legacyKeysFor(canonical)) {
      if (state[legacy] !== undefined) {
        value = state[legacy]
        break
      }
    }
  }
  if (value === undefined) value = state[widgetKey]
  sliceCache.set(widgetKey, value)
  return value
}

function flushWrite() {
  if (typeof window === 'undefined') return
  if (writeTimer !== null) {
    window.clearTimeout(writeTimer)
    writeTimer = null
  }
  void storageArea.set(WIDGET_SETTINGS_KEY, state).catch(() => {})
}

function scheduleWrite() {
  if (typeof window === 'undefined') return
  if (!flushListenerInstalled) {
    flushListenerInstalled = true
    // The store outlives every component, so the debounced write has no
    // unmount to flush from; persist on the way out instead.
    window.addEventListener('pagehide', () => {
      if (writeTimer !== null) flushWrite()
    })
  }
  if (writeTimer !== null) window.clearTimeout(writeTimer)
  writeTimer = window.setTimeout(() => {
    writeTimer = null
    void storageArea.set(WIDGET_SETTINGS_KEY, state).catch(() => {})
  }, WRITE_DEBOUNCE_MS)
}

function writeSetting(canonical: string, key: string, value: WidgetSettingValue) {
  const current = state[canonical]
  if (current?.[key] === value) return
  state = { ...state, [canonical]: { ...(current ?? {}), [key]: value } }
  notify()
  scheduleWrite()
}

/**
 * Per-plugin settings, keyed by the plugin id (e.g. `deepseek`).
 *
 * The settings schema is resolved from the mounted widget registry, so it is
 * only available while the widget plugin is enabled/mounted.
 */
export function useWidgetSettings(widgetKey: string) {
  const ctx = usePluginHost()
  useSyncExternalStore(ctx.widgets.subscribe, ctx.widgets.getVersion)
  const canonical = canonicalKey(widgetKey)
  const schema = ctx.widgets.get(canonical)?.settings ?? null

  const stored = useSyncExternalStore(subscribe, () => readSlice(widgetKey))

  const settings = useMemo(
    () => ({ ...widgetSettingsDefaults(schema), ...stored }),
    [schema, stored],
  )

  const setSetting = useCallback(
    (key: string, value: WidgetSettingValue) => writeSetting(canonical, key, value),
    [canonical],
  )

  return { settings, setSetting, schema }
}
