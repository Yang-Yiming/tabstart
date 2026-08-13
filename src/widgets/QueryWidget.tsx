import { Gauge, RefreshCw, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WidgetCard } from '../components/WidgetCard'
import { useStoredState } from '../hooks/useLocalStorage'
import { buildRequest, compileFilter, evaluatePath, formatValue, parseRows, thresholdColor } from './queryEngine'
import { defaultQueryConfig, type QueryConfig, type QueryRowDef } from './queryTypes'
import type { WidgetProps } from './types'
import { useWidgetSettings } from './widgetSettings'

interface CacheData {
  json: unknown
  fetchedAt: number
}

/**
 * Placeholder payload used in the Add-Widget preview (no live fetch, no key).
 * Covers the DeepSeek preset (balance_infos) and the Custom preset
 * (data.value / data.items) so both render something sensible.
 */
const PREVIEW_DATA = {
  is_available: true,
  balance_infos: [
    {
      currency: 'CNY',
      total_balance: '88.00',
      granted_balance: '10.00',
      topped_up_balance: '78.00',
    },
  ],
  data: {
    value: 123.45,
    items: [
      { name: '示例 A', value: 88, status: 'valid' },
      { name: '示例 B', value: 12, status: 'valid' },
      { name: '示例 C', value: 3, status: 'invalid' },
    ],
  },
}

function toNum(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(n) ? fallback : n
}

function toStr(value: unknown): string {
  return value == null ? '' : String(value)
}

function toBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function buildConfig(settings: Record<string, unknown>): QueryConfig {
  const base = defaultQueryConfig()
  return {
    title: toStr(settings.title ?? base.title),
    url: toStr(settings.url ?? base.url),
    headersJson: toStr(settings.headersJson ?? base.headersJson),
    apiKey: toStr(settings.apiKey ?? base.apiKey),
    mode: settings.mode === 'list' ? 'list' : 'rows',
    rowsJson: toStr(settings.rowsJson ?? base.rowsJson),
    listPath: toStr(settings.listPath ?? base.listPath),
    filter: toStr(settings.filter ?? base.filter),
    itemLabelPath: toStr(settings.itemLabelPath ?? base.itemLabelPath),
    itemValuePath: toStr(settings.itemValuePath ?? base.itemValuePath),
    valueFormat: (settings.valueFormat as QueryConfig['valueFormat']) ?? base.valueFormat,
    decimals: toNum(settings.decimals, base.decimals),
    prefix: toStr(settings.prefix ?? base.prefix),
    suffix: toStr(settings.suffix ?? base.suffix),
    thresholdValue: toNum(settings.thresholdValue, base.thresholdValue),
    thresholdMode: (settings.thresholdMode as QueryConfig['thresholdMode']) ?? base.thresholdMode,
    refreshMinutes: toNum(settings.refreshMinutes, base.refreshMinutes),
    maxItems: toNum(settings.maxItems, base.maxItems),
    hideOnEmpty: toBool(settings.hideOnEmpty, base.hideOnEmpty),
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds} 秒前`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false })
}

export function GaugeWidget({ widgetKey, preview }: WidgetProps) {
  const resolvedKey = widgetKey ?? 'gauge'
  const isPreview = preview === true
  const { settings } = useWidgetSettings(resolvedKey)

  const config = useMemo(() => buildConfig(settings), [settings])
  const request = useMemo(() => buildRequest(config), [config])
  const rowsResult = useMemo(
    () => (config.mode === 'rows' ? parseRows(config.rowsJson) : null),
    [config.mode, config.rowsJson],
  )
  const filterResult = useMemo(() => compileFilter(config.filter), [config.filter])

  const cacheKey = `gauge-cache:${resolvedKey}`
  const [cache, setCache, cacheHydrated] = useStoredState<CacheData | null>(cacheKey, null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const seqRef = useRef(0)
  const didInitialFetchRef = useRef(false)
  const lastRequestSigRef = useRef<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!request.ok) {
      setError(request.error)
      return
    }
    const seq = ++seqRef.current
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(request.url, { headers: request.headers, cache: 'no-store' })
      if (seq !== seqRef.current) return
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        setError(`HTTP ${response.status}${text ? ` · ${text.slice(0, 150)}` : ''}`)
        return
      }
      const json: unknown = await response.json()
      if (seq !== seqRef.current) return
      setCache({ json, fetchedAt: Date.now() })
    } catch (err) {
      if (seq !== seqRef.current) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }, [request, setCache])

  // Initial fetch once storage is hydrated (so we can show cached data instantly).
  useEffect(() => {
    if (isPreview || !cacheHydrated || didInitialFetchRef.current) return
    didInitialFetchRef.current = true
    fetchData()
  }, [isPreview, cacheHydrated, fetchData])

  // Refetch when the request itself changes (url / headers / api key).
  const requestSig = request.ok ? `${request.url}\u0000${JSON.stringify(request.headers)}` : 'invalid'
  useEffect(() => {
    if (isPreview || !cacheHydrated) return
    if (lastRequestSigRef.current !== null && lastRequestSigRef.current !== requestSig) {
      fetchData()
    }
    lastRequestSigRef.current = requestSig
  }, [isPreview, requestSig, cacheHydrated, fetchData])

  // Auto refresh interval.
  useEffect(() => {
    if (isPreview || config.refreshMinutes <= 0) return
    const id = window.setInterval(() => {
      fetchData()
    }, config.refreshMinutes * 60_000)
    return () => window.clearInterval(id)
  }, [isPreview, config.refreshMinutes, fetchData])

  // In preview mode show placeholder data instead of the (empty) cache.
  const displayCache = useMemo(
    () => (isPreview ? { json: PREVIEW_DATA, fetchedAt: Date.now() } : cache),
    [isPreview, cache],
  )

  const visibleRows = useMemo(() => {
    if (!rowsResult?.ok || !displayCache) return []
    return rowsResult.rows.filter((row: QueryRowDef) => {
      if (!config.hideOnEmpty) return true
      const value = evaluatePath(displayCache.json, row.path)
      return value != null && value !== ''
    })
  }, [rowsResult, displayCache, config.hideOnEmpty])

  const listItems = useMemo(() => {
    if (config.mode !== 'list' || !displayCache) return []
    const array = evaluatePath(displayCache.json, config.listPath)
    if (!Array.isArray(array)) return []
    const items = filterResult.ok && filterResult.fn ? array.filter(filterResult.fn) : array
    return items.slice(0, Math.max(1, config.maxItems)).flatMap((item, index) => {
      const raw = evaluatePath(item, config.itemValuePath)
      if (config.hideOnEmpty && (raw == null || raw === '')) return []
      return [
        {
          key: index,
          label: toStr(evaluatePath(item, config.itemLabelPath)) || `#${index + 1}`,
          text: formatValue(raw, {
            format: config.valueFormat,
            decimals: config.decimals,
            prefix: config.prefix,
            suffix: config.suffix,
          }),
          raw,
        },
      ]
    })
  }, [config, displayCache, filterResult])

  const valueColor = (color: 'danger' | 'success' | null) =>
    color === 'danger' ? 'text-rose-300' : color === 'success' ? 'text-emerald-300' : 'text-white'

  return (
    <WidgetCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
          <Gauge className="h-3 w-3 shrink-0 text-sky-200/70" />
          <span className="truncate">{config.title || 'Gauge'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isPreview && cache && <span className="text-[10px] text-white/35">{timeAgo(cache.fetchedAt)}</span>}
          <button
            type="button"
            onClick={() => {
              fetchData()
            }}
            disabled={loading}
            className="rounded-full p-1 text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="刷新"
            title="刷新"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {error && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-1.5 text-xs text-rose-300/90">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-all">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                fetchData()
              }}
              className="self-start rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              重试
            </button>
          </div>
        )}

        {!error && !displayCache && loading && <div className="text-center text-xs text-white/35">加载中…</div>}
        {!error && !displayCache && !loading && (
          <div className="text-center text-xs text-white/35">点击右上角刷新获取数据</div>
        )}

        {!error && displayCache && config.mode === 'rows' && rowsResult && (
          <div className="flex flex-col gap-2">
            {rowsResult.ok ? (
              visibleRows.map((row: QueryRowDef, index: number) => {
                const raw = evaluatePath(displayCache.json, row.path)
                const text = formatValue(raw, {
                  format: row.format ?? 'number',
                  decimals: toNum(row.decimals, 2),
                  prefix: toStr(row.prefix),
                  suffix: toStr(row.suffix),
                })
                const color = thresholdColor(raw, row.thresholdMode ?? 'none', toNum(row.thresholdValue, 0))
                return (
                  <div key={index} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-xs text-white/55">{row.label}</span>
                    <span className={`shrink-0 font-mono text-sm ${valueColor(color)}`}>{text}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-xs text-rose-300/80">{rowsResult.error}</div>
            )}
            {rowsResult.ok && rowsResult.rows.length > 0 && visibleRows.length === 0 && (
              <div className="text-xs text-white/35">无数据显示</div>
            )}
          </div>
        )}

        {!error && displayCache && config.mode === 'list' && (
          <ul className="flex flex-col gap-1.5">
            {listItems.map((item) => {
              const color = thresholdColor(item.raw, config.thresholdMode, config.thresholdValue)
              return (
                <li key={item.key} className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-xs text-white/55">{item.label}</span>
                  <span className={`shrink-0 font-mono text-sm ${valueColor(color)}`}>{item.text}</span>
                </li>
              )
            })}
            {listItems.length === 0 && <li className="text-xs text-white/35">无数据</li>}
          </ul>
        )}

        {!error && displayCache && !filterResult.ok && (
          <div className="text-xs text-rose-300/80">过滤语句错误: {filterResult.error}</div>
        )}
      </div>
    </WidgetCard>
  )
}
