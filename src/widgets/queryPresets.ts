import type { WidgetSettingField, WidgetSettingsSchema } from './types'
import { defaultQueryConfig, type QueryConfig } from './queryTypes'

export interface GaugePresetDef {
  id: string
  label: string
  description?: string
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
  config: QueryConfig
  /** Only expose title / apiKey / refreshMinutes in settings; keep the rest as hidden defaults. */
  minimalSettings?: boolean
}

export interface GaugeSchemaOptions {
  minimal?: boolean
}

const modeOptions = [
  { value: 'rows', label: '固定行 (rows)' },
  { value: 'list', label: '列表 (list)' },
]

const valueFormatOptions = [
  { value: 'number', label: '数字' },
  { value: 'percent', label: '百分比 (×100%)' },
  { value: 'bytes', label: '字节大小' },
  { value: 'text', label: '文本' },
  { value: 'date', label: '日期时间' },
]

const thresholdOptions = [
  { value: 'none', label: '不告警' },
  { value: 'lt', label: '小于阈值变红' },
  { value: 'gt', label: '大于阈值变红' },
]

/** Build the per-variant settings schema for a Gauge preset. */
export function gaugeSettingsSchema(config: QueryConfig, options: GaugeSchemaOptions = {}): WidgetSettingsSchema {
  const d = config
  const minimal = options.minimal === true
  const fields: WidgetSettingField[] = [
    {
      type: 'text',
      key: 'title',
      label: '标题',
      description: '卡片标题，留空则显示 Gauge。',
      default: d.title,
    },
    {
      type: 'text',
      key: 'url',
      label: '请求 URL',
      description: '支持 {API_KEY} 占位符。',
      default: d.url,
    },
    {
      type: 'json',
      key: 'headersJson',
      label: '请求头 (JSON)',
      description: '如 {"Authorization":"Bearer {API_KEY}"}。',
      default: d.headersJson,
      rows: 3,
    },
    {
      type: 'password',
      key: 'apiKey',
      label: 'API Key',
      description: '替换请求中的 {API_KEY}。仅保存在本机浏览器，不会回显。',
      default: d.apiKey,
    },
    {
      type: 'select',
      key: 'mode',
      label: '展示模式',
      description: 'rows：固定几行"标签 + 值"；list：取一个数组逐条展示。',
      options: modeOptions,
      default: d.mode,
    },
    {
      type: 'json',
      key: 'rowsJson',
      label: '固定行 (JSON)',
      description:
        '每行一个对象：{"label","path","format?","decimals?","prefix?","suffix?","thresholdValue?","thresholdMode?"}',
      default: d.rowsJson,
      rows: 8,
      showWhen: (s) => s.mode === 'rows',
    },
    {
      type: 'text',
      key: 'listPath',
      label: '列表路径',
      description: '指向数组的路径，如 data.items。',
      default: d.listPath,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'text',
      key: 'filter',
      label: '过滤语句',
      description: '对每个 item 求值的表达式，如 item.status == "valid" && item.amount > 0',
      default: d.filter,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'text',
      key: 'itemLabelPath',
      label: '条目名称路径',
      description: '相对于每个 item，如 name。',
      default: d.itemLabelPath,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'text',
      key: 'itemValuePath',
      label: '条目数值路径',
      description: '相对于每个 item，如 value。',
      default: d.itemValuePath,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'number',
      key: 'maxItems',
      label: '最多显示条数',
      min: 1,
      max: 50,
      step: 1,
      default: d.maxItems,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'select',
      key: 'valueFormat',
      label: '数值格式',
      options: valueFormatOptions,
      default: d.valueFormat,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'number',
      key: 'decimals',
      label: '小数位数',
      min: 0,
      max: 6,
      step: 1,
      default: d.decimals,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'text',
      key: 'prefix',
      label: '前缀',
      default: d.prefix,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'text',
      key: 'suffix',
      label: '后缀',
      default: d.suffix,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'number',
      key: 'thresholdValue',
      label: '告警阈值',
      default: d.thresholdValue,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'select',
      key: 'thresholdMode',
      label: '告警方式',
      options: thresholdOptions,
      default: d.thresholdMode,
      showWhen: (s) => s.mode === 'list',
    },
    {
      type: 'number',
      key: 'refreshMinutes',
      label: '自动刷新间隔 (分钟)',
      description: '0 = 仅手动刷新。',
      min: 0,
      max: 1440,
      step: 5,
      default: d.refreshMinutes,
    },
    {
      type: 'boolean',
      key: 'hideOnEmpty',
      label: '隐藏空值',
      description: '值不存在时隐藏该行 / 该条目。',
      default: d.hideOnEmpty,
    },
  ]
  const schema: WidgetSettingsSchema = {
    title: d.title || 'Gauge',
    description: minimal
      ? '只需填 API Key 即可。URL、行定义等已使用预设默认值；想深度定制请用 Custom 预设。'
      : '查询接口并把响应渲染成卡片。密钥只保存在本机浏览器。',
    fields,
  }
  if (!minimal) return schema

  // Minimal mode: keep only title / apiKey / refreshMinutes visible.
  const keep = new Set(['title', 'apiKey', 'refreshMinutes'])
  return {
    ...schema,
    fields: schema.fields.map((field) =>
      keep.has(field.key) ? field : { ...field, showWhen: () => false },
    ),
  }
}

export const gaugePresets: GaugePresetDef[] = [
  {
    id: 'deepseek-balance',
    label: 'DeepSeek Balance',
    description: 'DeepSeek API 余额（GET /user/balance）',
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    minH: 1,
    config: {
      ...defaultQueryConfig(),
      title: 'DeepSeek',
      url: 'https://api.deepseek.com/user/balance',
      headersJson: JSON.stringify({ Authorization: 'Bearer {API_KEY}' }, null, 2),
      mode: 'rows',
      rowsJson: JSON.stringify(
        [
          {
            label: '总余额',
            path: 'balance_infos.0.total_balance',
            format: 'number',
            decimals: 2,
            suffix: ' CNY',
            thresholdValue: 10,
            thresholdMode: 'lt',
          },
          {
            label: '赠送额度',
            path: 'balance_infos.0.granted_balance',
            format: 'number',
            decimals: 2,
            suffix: ' CNY',
          },
          {
            label: '充值额度',
            path: 'balance_infos.0.topped_up_balance',
            format: 'number',
            decimals: 2,
            suffix: ' CNY',
          },
        ],
        null,
        2,
      ),
      refreshMinutes: 30,
    },
    minimalSettings: true,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: '空白配置，完全自定义',
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    minH: 1,
    config: defaultQueryConfig(),
  },
]
