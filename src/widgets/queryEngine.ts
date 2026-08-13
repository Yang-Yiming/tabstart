import type { QueryRowDef, QueryValueFormat, ThresholdMode } from './queryTypes'

/* ------------------------------------------------------------------ */
/* Dot-path evaluation                                                 */
/* ------------------------------------------------------------------ */

function getProp(value: unknown, name: string): unknown {
  if (value == null) return undefined
  if (typeof value !== 'object') return undefined
  if (!(name in Object(value))) return undefined
  return (value as Record<string, unknown>)[name]
}

/**
 * Resolve a dot path (with optional array indexes) against a JSON value.
 * Supports `a.b.c`, `a.0.b` and `a[0].b`. Returns `undefined` when any
 * segment is missing.
 */
export function evaluatePath(data: unknown, path: string): unknown {
  if (!path) return undefined
  const normalized = path.replace(/\[(\d+)\]/g, '.$1')
  const segments = normalized.split('.').filter((s) => s.length > 0)
  let value: unknown = data
  for (const segment of segments) {
    if (value == null) return undefined
    if (/^\d+$/.test(segment)) {
      value = Array.isArray(value) ? value[Number(segment)] : undefined
    } else {
      value = getProp(value, segment)
    }
    if (value === undefined) return undefined
  }
  return value
}

/* ------------------------------------------------------------------ */
/* Filter DSL (safe recursive-descent parser, no eval)                 */
/* ------------------------------------------------------------------ */

type Token =
  | { t: 'ident'; v: string }
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'op'; v: string }
  | { t: 'punct'; v: string }
  | { t: 'eof'; v: '' }

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const isIdentStart = (c: string) => /[A-Za-z_$]/.test(c)
  const isIdentPart = (c: string) => /[A-Za-z0-9_$]/.test(c)

  while (i < source.length) {
    const c = source[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '"' || c === "'") {
      const quote = c
      let j = i + 1
      let out = ''
      while (j < source.length && source[j] !== quote) {
        if (source[j] === '\\' && j + 1 < source.length) {
          out += source[j + 1]
          j += 2
        } else {
          out += source[j]
          j++
        }
      }
      if (j >= source.length) throw new Error('字符串未闭合')
      tokens.push({ t: 'str', v: out })
      i = j + 1
      continue
    }
    if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(source[i + 1] ?? ''))) {
      let j = i
      let num = ''
      while (j < source.length && /[0-9.]/.test(source[j])) {
        num += source[j]
        j++
      }
      const n = Number(num)
      if (Number.isNaN(n)) throw new Error(`非法数字: ${num}`)
      tokens.push({ t: 'num', v: n })
      i = j
      continue
    }
    if (isIdentStart(c)) {
      let j = i
      let id = ''
      while (j < source.length && isIdentPart(source[j])) {
        id += source[j]
        j++
      }
      tokens.push({ t: 'ident', v: id })
      i = j
      continue
    }
    if (c === '=' || c === '!' || c === '<' || c === '>') {
      const two = source.slice(i, i + 2)
      if (two === '==' || two === '!=' || two === '<=' || two === '>=') {
        tokens.push({ t: 'op', v: two })
        i += 2
        continue
      }
      if (two === '=' || two === '!') throw new Error(`非法运算符: ${two}`)
      tokens.push({ t: 'op', v: c })
      i++
      continue
    }
    if (c === '&' || c === '|') {
      const two = source.slice(i, i + 2)
      if (two === '&&' || two === '||') {
        tokens.push({ t: 'op', v: two })
        i += 2
        continue
      }
      throw new Error(`非法运算符: ${two}`)
    }
    if ('()[].,'.includes(c)) {
      tokens.push({ t: 'punct', v: c })
      i++
      continue
    }
    throw new Error(`无法识别的字符: ${c}`)
  }
  tokens.push({ t: 'eof', v: '' })
  return tokens
}

type Part =
  | { kind: 'prop'; name: string }
  | { kind: 'index'; idx: number }
  | { kind: 'call'; name: string; args: Expr[] }

type Expr =
  | { k: 'or'; l: Expr; r: Expr }
  | { k: 'and'; l: Expr; r: Expr }
  | { k: 'not'; e: Expr }
  | { k: 'cmp'; op: string; l: Expr; r: Expr }
  | { k: 'path'; parts: Part[] }
  | { k: 'lit'; v: string | number | boolean }

class Parser {
  private pos = 0
  private readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private next(): Token {
    return this.tokens[this.pos++]
  }

  private expectIdent(): string {
    const tok = this.peek()
    if (tok.t !== 'ident') throw new Error(`期望标识符，得到 ${describe(tok)}`)
    this.next()
    return tok.v
  }

  private expectNum(): number {
    const tok = this.peek()
    if (tok.t !== 'num') throw new Error(`期望数字，得到 ${describe(tok)}`)
    this.next()
    return tok.v
  }

  private expectPunct(value: string) {
    const tok = this.peek()
    if (tok.t !== 'punct' || tok.v !== value) throw new Error(`期望 "${value}"，得到 ${describe(tok)}`)
    this.next()
  }

  expectEof() {
    const tok = this.peek()
    if (tok.t !== 'eof') throw new Error(`多余的内容: ${describe(tok)}`)
  }

  parseOr(): Expr {
    let left = this.parseAnd()
    while (this.peek().t === 'op' && this.peek().v === '||') {
      this.next()
      left = { k: 'or', l: left, r: this.parseAnd() }
    }
    return left
  }

  private parseAnd(): Expr {
    let left = this.parseNot()
    while (this.peek().t === 'op' && this.peek().v === '&&') {
      this.next()
      left = { k: 'and', l: left, r: this.parseNot() }
    }
    return left
  }

  private parseNot(): Expr {
    if (this.peek().t === 'op' && this.peek().v === '!') {
      this.next()
      return { k: 'not', e: this.parseNot() }
    }
    return this.parseComparison()
  }

  private parseComparison(): Expr {
    const left = this.parseFactor()
    const tok = this.peek()
    if (tok.t === 'op' && (tok.v === '==' || tok.v === '!=' || tok.v === '<' || tok.v === '>' || tok.v === '<=' || tok.v === '>=')) {
      this.next()
      const right = this.parseFactor()
      return { k: 'cmp', op: tok.v, l: left, r: right }
    }
    return left
  }

  private parseFactor(): Expr {
    const tok = this.peek()
    if (tok.t === 'num') {
      this.next()
      return { k: 'lit', v: tok.v }
    }
    if (tok.t === 'str') {
      this.next()
      return { k: 'lit', v: tok.v }
    }
    if (tok.t === 'ident') return this.parsePath()
    if (tok.t === 'punct' && tok.v === '(') {
      this.next()
      const expr = this.parseOr()
      this.expectPunct(')')
      return expr
    }
    throw new Error(`表达式错误: ${describe(tok)}`)
  }

  private parsePath(): Expr {
    const first = this.expectIdent()
    const parts: Part[] = [{ kind: 'prop', name: first }]
    while (true) {
      const tok = this.peek()
      if (tok.t === 'punct' && tok.v === '.') {
        this.next()
        const n = this.peek()
        if (n.t === 'ident') {
          this.next()
          parts.push({ kind: 'prop', name: n.v })
        } else if (n.t === 'num') {
          this.next()
          parts.push({ kind: 'index', idx: n.v })
        } else {
          throw new Error(`路径语法错误: ${describe(n)}`)
        }
      } else if (tok.t === 'punct' && tok.v === '[') {
        this.next()
        const idx = this.expectNum()
        this.expectPunct(']')
        parts.push({ kind: 'index', idx })
      } else if (tok.t === 'punct' && tok.v === '(') {
        const last = parts[parts.length - 1]
        if (last.kind !== 'prop') throw new Error('方法调用位置错误')
        this.next()
        const args: Expr[] = []
        if (!(this.peek().t === 'punct' && this.peek().v === ')')) {
          args.push(this.parseOr())
          while (this.peek().t === 'punct' && this.peek().v === ',') {
            this.next()
            args.push(this.parseOr())
          }
        }
        this.expectPunct(')')
        parts[parts.length - 1] = { kind: 'call', name: last.name, args }
      } else {
        break
      }
    }
    return { k: 'path', parts }
  }
}

function describe(tok: Token): string {
  switch (tok.t) {
    case 'eof':
      return '结尾'
    case 'ident':
      return `"${tok.v}"`
    case 'num':
      return String(tok.v)
    case 'str':
      return `字符串 "${tok.v}"`
    case 'op':
      return `运算符 "${tok.v}"`
    case 'punct':
      return `"${tok.v}"`
  }
}

function looseEq(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a === b
  if (typeof a === 'string' && typeof b === 'string') return a === b
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b
  const na = Number(a)
  const nb = Number(b)
  if (a != null && b != null && !Number.isNaN(na) && !Number.isNaN(nb)) return na === nb
  return a === b
}

function compareValues(a: unknown, b: unknown): number | null {
  const na = Number(a)
  const nb = Number(b)
  if (a != null && b != null && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  const sa = String(a ?? '')
  const sb = String(b ?? '')
  return sa < sb ? -1 : sa > sb ? 1 : 0
}

function callMethod(value: unknown, name: string, args: unknown[]): unknown {
  if (name === 'includes') {
    if (typeof value === 'string' && typeof args[0] === 'string') return value.includes(args[0])
    if (Array.isArray(value)) return value.some((x) => looseEq(x, args[0]))
    return false
  }
  if (name === 'startsWith' && typeof value === 'string' && typeof args[0] === 'string') {
    return value.startsWith(args[0])
  }
  if (name === 'endsWith' && typeof value === 'string' && typeof args[0] === 'string') {
    return value.endsWith(args[0])
  }
  throw new Error(`不支持的方法: ${name}()`)
}

function evalExpr(expr: Expr, item: unknown): unknown {
  switch (expr.k) {
    case 'lit':
      return expr.v
    case 'path': {
      let value: unknown = item
      for (let i = 0; i < expr.parts.length; i++) {
        const part = expr.parts[i]
        if (part.kind === 'prop') {
          if (i === 0 && part.name === 'item') continue
          value = getProp(value, part.name)
        } else if (part.kind === 'index') {
          value = Array.isArray(value) ? value[part.idx] : undefined
        } else {
          value = callMethod(value, part.name, part.args.map((a) => evalExpr(a, item)))
        }
        if (value === undefined || value === null) return undefined
      }
      return value
    }
    case 'not':
      return !evalExpr(expr.e, item)
    case 'and': {
      const l = evalExpr(expr.l, item)
      if (!l) return false
      return Boolean(evalExpr(expr.r, item))
    }
    case 'or': {
      const l = evalExpr(expr.l, item)
      if (l) return true
      return Boolean(evalExpr(expr.r, item))
    }
    case 'cmp': {
      const l = evalExpr(expr.l, item)
      const r = evalExpr(expr.r, item)
      switch (expr.op) {
        case '==':
          return looseEq(l, r)
        case '!=':
          return !looseEq(l, r)
        default: {
          const diff = compareValues(l, r)
          if (diff === null) return false
          return expr.op === '<' ? diff < 0 : expr.op === '>' ? diff > 0 : expr.op === '<=' ? diff <= 0 : diff >= 0
        }
      }
    }
  }
}

export interface FilterResult {
  ok: boolean
  error?: string
  fn?: (item: unknown) => boolean
}

/**
 * Compile a filter expression into a predicate over each list item.
 * Example: `item.status == "valid" && item.amount > 0`.
 * `item.` is optional on the first segment: `status == "valid"` also works.
 */
export function compileFilter(source: string): FilterResult {
  const src = source.trim()
  if (!src) return { ok: true, fn: () => true }
  try {
    const parser = new Parser(tokenize(src))
    const expr = parser.parseOr()
    parser.expectEof()
    return { ok: true, fn: (item) => Boolean(evalExpr(expr, item)) }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatValue(
  raw: unknown,
  opts: { format: QueryValueFormat; decimals: number; prefix: string; suffix: string },
): string {
  const { format, decimals, prefix, suffix } = opts
  if (raw == null) return ''
  if (format === 'text') return prefix + String(raw) + suffix
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (Number.isNaN(num)) return prefix + String(raw) + suffix

  const numFormat = () =>
    new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })

  switch (format) {
    case 'percent':
      return prefix + numFormat().format(num * 100) + '%' + suffix
    case 'bytes': {
      let v = num
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let u = 0
      while (v >= 1024 && u < units.length - 1) {
        v /= 1024
        u++
      }
      return prefix + numFormat().format(v) + ' ' + units[u] + suffix
    }
    case 'date': {
      const date = typeof raw === 'number' || /^\d+$/.test(String(raw)) ? new Date(num) : new Date(String(raw))
      if (Number.isNaN(date.getTime())) return prefix + String(raw) + suffix
      return prefix + date.toLocaleString('zh-CN', { hour12: false }) + suffix
    }
    case 'number':
    default:
      return prefix + numFormat().format(num) + suffix
  }
}

export type ThresholdColor = 'danger' | 'success'

export function thresholdColor(raw: unknown, mode: ThresholdMode, value: number): ThresholdColor | null {
  if (mode === 'none') return null
  const num = typeof raw === 'number' ? raw : Number(raw)
  if (Number.isNaN(num)) return null
  const triggered = mode === 'lt' ? num < value : num > value
  return triggered ? 'danger' : 'success'
}

/* ------------------------------------------------------------------ */
/* Request building                                                    */
/* ------------------------------------------------------------------ */

export type BuildRequestResult =
  | { ok: true; url: string; headers: Record<string, string> }
  | { ok: false; error: string }

export function buildRequest(input: { url: string; headersJson: string; apiKey: string }): BuildRequestResult {
  const url = input.url.replace(/\{API_KEY\}/g, encodeURIComponent(input.apiKey))
  if (!url.trim()) return { ok: false, error: 'URL 不能为空' }

  let headers: Record<string, string> = {}
  const raw = input.headersJson.trim()
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ok: false, error: '请求头必须是 JSON 对象，如 {"Authorization":"Bearer xxx"}' }
      }
      headers = parsed as Record<string, string>
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? `请求头 JSON 解析失败: ${error.message}` : '请求头 JSON 解析失败',
      }
    }
  }
  for (const key of Object.keys(headers)) {
    headers[key] = headers[key].replace(/\{API_KEY\}/g, input.apiKey)
  }
  return { ok: true, url, headers }
}

export type ParseRowsResult = { ok: true; rows: QueryRowDef[] } | { ok: false; error: string }

export function parseRows(source: string): ParseRowsResult {
  if (!source.trim()) return { ok: true, rows: [] }
  try {
    const parsed: unknown = JSON.parse(source)
    if (!Array.isArray(parsed)) return { ok: false, error: 'rows 必须是数组' }
    return { ok: true, rows: parsed as QueryRowDef[] }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `rows JSON 解析失败: ${error.message}` : 'rows JSON 解析失败',
    }
  }
}

/* ------------------------------------------------------------------ */
/* Peak windows (local-time pricing alerts)                            */
/* ------------------------------------------------------------------ */

export interface PeakWindow {
  /** Local time "HH:MM". */
  from: string
  /** Local time "HH:MM". */
  to: string
}

function toMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

/** Parse a JSON array of `{from, to}` windows; invalid entries are dropped. */
export function parsePeakWindows(source: string): PeakWindow[] {
  const raw = source.trim()
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is PeakWindow =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as PeakWindow).from === 'string' &&
        typeof (entry as PeakWindow).to === 'string',
    )
  } catch {
    return []
  }
}

/** True when the given local time falls inside any window (windows may cross midnight). */
export function isInPeakWindows(windows: PeakWindow[], date = new Date()): boolean {
  if (windows.length === 0) return false
  const minutes = date.getHours() * 60 + date.getMinutes()
  return windows.some((window) => {
    const from = toMinutes(window.from)
    const to = toMinutes(window.to)
    if (from == null || to == null) return false
    return from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to
  })
}
