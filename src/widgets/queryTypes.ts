export type QueryValueFormat = 'number' | 'percent' | 'bytes' | 'text' | 'date'
export type QueryMode = 'rows' | 'list'
export type ThresholdMode = 'lt' | 'gt' | 'none'

export interface QueryRowDef {
  label: string
  /** Dot path into the response, e.g. `balance_infos.0.total_balance`. */
  path: string
  format?: QueryValueFormat
  decimals?: number
  prefix?: string
  suffix?: string
  thresholdValue?: number
  thresholdMode?: ThresholdMode
}

export interface QueryConfig {
  title: string
  url: string
  /** JSON object of headers; `{API_KEY}` is substituted with the API key. */
  headersJson: string
  apiKey: string
  mode: QueryMode
  rowsJson: string
  listPath: string
  filter: string
  itemLabelPath: string
  itemValuePath: string
  valueFormat: QueryValueFormat
  decimals: number
  prefix: string
  suffix: string
  thresholdValue: number
  thresholdMode: ThresholdMode
  /** 0 = manual refresh only. */
  refreshMinutes: number
  maxItems: number
  hideOnEmpty: boolean
}

export function defaultQueryConfig(): QueryConfig {
  return {
    title: '',
    url: 'https://',
    headersJson: '{}',
    apiKey: '',
    mode: 'rows',
    rowsJson: JSON.stringify([{ label: '值', path: 'data.value' }], null, 2),
    listPath: 'data.items',
    filter: '',
    itemLabelPath: 'name',
    itemValuePath: 'value',
    valueFormat: 'number',
    decimals: 2,
    prefix: '',
    suffix: '',
    thresholdValue: 0,
    thresholdMode: 'none',
    refreshMinutes: 30,
    maxItems: 5,
    hideOnEmpty: false,
  }
}
