import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { USER_PLUGINS_ENV, getUserPluginsRoot } from './user-plugins-dir'

const root = process.cwd()
const pluginsDir = join(root, 'src', 'plugins')
const configPath = join(pluginsDir, 'plugin.config.json')
const generatedPath = join(pluginsDir, 'registry.generated.ts')
const tsconfigAppPath = join(root, 'tsconfig.app.json')

interface PluginConfig {
  plugins?: string[]
}

interface PluginPackage {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

/** Where a plugin folder was found. */
interface PluginLocation {
  /** Last path segment, e.g. `liquid-glass`. Must be unique across both roots. */
  name: string
  /** Path relative to its root; used for display and external import specifiers. */
  rel: string
  absolute: string
  /** True when discovered under the user-plugins root instead of src/plugins. */
  external: boolean
}

/* ------------------------------------------------------------------ */
/* Discovery                                                           */
/* ------------------------------------------------------------------ */

function listBuiltinPlugins(): PluginLocation[] {
  return readdirSync(pluginsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(pluginsDir, entry.name, 'plugin.tsx')))
    .map((entry) => ({
      name: entry.name,
      rel: entry.name,
      absolute: join(pluginsDir, entry.name),
      external: false,
    }))
    .sort((a, b) => a.rel.localeCompare(b.rel))
}

/**
 * User plugins live under the user-plugins root (see user-plugins-dir.ts).
 * Both layouts are supported so several repos can sit side by side:
 *   <root>/<plugin>/plugin.tsx          (depth 1)
 *   <root>/<repo>/<plugin>/plugin.tsx   (depth 2)
 */
function listExternalPlugins(): PluginLocation[] {
  const userRoot = getUserPluginsRoot()
  if (existsSync(userRoot) === false) return []

  const out: PluginLocation[] = []
  const visit = (dir: string, rel: string, depth: number) => {
    if (existsSync(join(dir, 'plugin.tsx'))) {
      out.push({ name: rel.split('/').pop() as string, rel, absolute: dir, external: true })
      return
    }
    if (depth >= 2) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() === false) continue
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      visit(join(dir, entry.name), `${rel}/${entry.name}`, depth + 1)
    }
  }

  for (const entry of readdirSync(userRoot, { withFileTypes: true })) {
    if (entry.isDirectory() === false) continue
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    visit(join(userRoot, entry.name), entry.name, 1)
  }

  return out.sort((a, b) => a.rel.localeCompare(b.rel))
}

function warnNameCollisions(all: PluginLocation[]): void {
  const seen = new Map<string, PluginLocation>()
  for (const location of all) {
    const first = seen.get(location.name)
    if (first) {
      console.warn(
        `[plugin-sync] duplicate plugin folder "${location.name}": ${first.rel} vs ${location.rel}; keeping ${first.rel}`,
      )
      continue
    }
    seen.set(location.name, location)
  }
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

function readConfig(): string[] {
  if (existsSync(configPath) === false) {
    const fallback = listBuiltinPlugins().map((location) => location.name)
    console.warn(`[plugin-sync] ${configPath} not found; enabling all built-in plugins: ${fallback.join(', ')}`)
    return fallback
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf8')) as PluginConfig
  if (Array.isArray(raw.plugins) === false) {
    throw new Error(`[plugin-sync] ${configPath} must contain a "plugins" array`)
  }

  // The config governs built-in plugins only; everything found under the
  // user-plugins root is always bundled.
  const available = new Set(listBuiltinPlugins().map((location) => location.name))
  const unknown = raw.plugins.filter((id) => available.has(id) === false)
  if (unknown.length > 0) {
    console.warn(`[plugin-sync] unknown built-in plugin ids in config: ${unknown.join(', ')}`)
  }

  return raw.plugins.filter((id) => available.has(id))
}

/* ------------------------------------------------------------------ */
/* Dependency install (opt-in per plugin via its own package.json)     */
/* ------------------------------------------------------------------ */

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

function syncPluginDependencies(enabledDirs: PluginLocation[]): void {
  for (const dir of enabledDirs) {
    const pkgPath = join(dir.absolute, 'package.json')
    if (existsSync(pkgPath) === false) continue

    const pkgText = readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(pkgText) as PluginPackage
    const depCount =
      Object.values(pkg.dependencies ?? {}).length +
      Object.values(pkg.devDependencies ?? {}).length +
      Object.values(pkg.peerDependencies ?? {}).length +
      Object.values(pkg.optionalDependencies ?? {}).length
    if (depCount === 0) continue

    const nodeModules = join(dir.absolute, 'node_modules')
    const marker = join(nodeModules, '.plugin-sync-hash')
    const hash = hashText(pkgText)
    if (existsSync(marker) && existsSync(nodeModules) && readFileSync(marker, 'utf8') === hash) {
      console.log(`[plugin-sync] ${dir.rel}: dependencies up to date`)
      continue
    }

    console.log(`[plugin-sync] ${dir.rel}: installing dependencies...`)
    const installArgs = ['install', '--cwd', dir.absolute, '--no-save']
    if (process.env.BUN_CACHE_DIR) {
      installArgs.push('--cache-dir', process.env.BUN_CACHE_DIR)
    }
    const result = spawnSync('bun', installArgs, {
      stdio: 'inherit',
      env: { ...process.env, BUN_TMPDIR: process.env.BUN_TMPDIR ?? process.env.TMPDIR ?? '' },
    })
    if (result.status !== 0) {
      throw new Error(`[plugin-sync] bun install failed for ${dir.rel}`)
    }

    mkdirSync(nodeModules, { recursive: true })
    writeFileSync(marker, hash)
  }
}

/* ------------------------------------------------------------------ */
/* Registry generation                                                 */
/* ------------------------------------------------------------------ */

function camelName(dir: string): string {
  const words = dir.split('-')
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('')
}

/** Unique JS identifier per plugin module (last segment, suffix on collision). */
function variableNames(locations: PluginLocation[]): Map<string, string> {
  const names = new Map<string, string>()
  const used = new Set<string>()
  for (const location of locations) {
    let candidate = `${camelName(location.name)}Plugins`
    let suffix = 2
    while (used.has(candidate)) candidate = `${camelName(location.name)}${suffix++}Plugins`
    used.add(candidate)
    names.set(location.rel, candidate)
  }
  return names
}

function generateRegistry(enabledDirs: PluginLocation[]): void {
  const varNames = variableNames(enabledDirs)

  const lines: string[] = [
    '// Auto-generated by scripts/plugin-sync.ts. DO NOT EDIT.',
    "import type { HomepagePlugin } from './runtime'",
    '',
  ]

  for (const location of enabledDirs) {
    const specifier = location.external ? `@ext/${location.rel}/plugin` : `./${location.rel}/plugin`
    lines.push(`import { plugins as ${varNames.get(location.rel)} } from '${specifier}'`)
  }

  lines.push('')
  lines.push('export interface EnabledPluginModule {')
  lines.push('  dir: string')
  lines.push('  plugins: HomepagePlugin[]')
  lines.push('}')
  lines.push('')
  lines.push('export const enabledPluginModules: EnabledPluginModule[] = [')
  for (const location of enabledDirs) {
    lines.push(`  { dir: '${location.rel}', plugins: ${varNames.get(location.rel)} },`)
  }
  lines.push(']')
  lines.push('')

  const generated = lines.join('\n')
  if (existsSync(generatedPath) === false || readFileSync(generatedPath, 'utf8') !== generated) {
    writeFileSync(generatedPath, generated)
    console.log(`[plugin-sync] wrote ${generatedPath}`)
  }
}

/* ------------------------------------------------------------------ */
/* tsconfig include / exclude                                          */
/* ------------------------------------------------------------------ */

function stripJsonComments(text: string): string {
  let result = ''
  let inString = false
  let inBlockComment = false
  let inLineComment = false
  let quote = ''

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
        result += char
      }
      continue
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        i += 1
      }
      continue
    }

    if (inString) {
      result += char
      if (char === '\\') {
        result += next ?? ''
        i += 1
      } else if (char === quote) {
        inString = false
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quote = char
      result += char
      continue
    }

    if (char === '/' && next === '/') {
      inLineComment = true
      i += 1
      continue
    }

    if (char === '/' && next === '*') {
      inBlockComment = true
      i += 1
      continue
    }

    result += char
  }

  return result
}

function updateTsconfig(builtins: PluginLocation[], externals: PluginLocation[], enabledNames: Set<string>): void {
  if (existsSync(tsconfigAppPath) === false) return

  const raw = readFileSync(tsconfigAppPath, 'utf8')
  let tsconfig: { exclude?: string[]; include?: string[] } & Record<string, unknown>
  try {
    tsconfig = JSON.parse(stripJsonComments(raw)) as typeof tsconfig
  } catch (error) {
    console.warn(`[plugin-sync] could not update ${tsconfigAppPath}: ${String(error)}`)
    return
  }

  // Disabled built-ins stay out of tsc; enabled user plugins are pulled in explicitly.
  const userRootRel = relative(root, getUserPluginsRoot()).split('\\').join('/')
  const disabledBuiltins = builtins.filter((location) => enabledNames.has(location.name) === false)
  const nextExclude = disabledBuiltins.map((location) => `src/plugins/${location.name}`).sort()
  const nextInclude = ['src', ...externals.map((location) => `${userRootRel}/${location.rel}`)]

  // The '@ext' alias must match the user-plugins root for tsc as it does for vite.
  const compilerOptions = (tsconfig.compilerOptions ??= {}) as Record<string, unknown>
  const prevPaths = ((compilerOptions.paths ?? {}) as Record<string, string[]>)
  const paths: Record<string, string[]> = { ...prevPaths }
  paths['@ext/*'] = [`./${userRootRel}/*`]
  if (Object.keys(paths).length > 0) compilerOptions.paths = paths

  const excludeChanged = JSON.stringify(tsconfig.exclude ?? []) !== JSON.stringify(nextExclude)
  const includeChanged = JSON.stringify(tsconfig.include ?? ['src']) !== JSON.stringify(nextInclude)
  const pathsChanged = JSON.stringify(prevPaths) !== JSON.stringify(paths)
  if (excludeChanged === false && includeChanged === false && pathsChanged === false) return

  if (nextExclude.length > 0) tsconfig.exclude = nextExclude
  else delete tsconfig.exclude
  tsconfig.include = nextInclude

  writeFileSync(tsconfigAppPath, JSON.stringify(tsconfig, null, 2) + '\n')
  console.log(`[plugin-sync] updated ${tsconfigAppPath}`)
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

function main(): void {
  const builtins = listBuiltinPlugins()
  const externals = listExternalPlugins()
  warnNameCollisions([...builtins, ...externals])

  const configured = readConfig()
  // Core slots (clock/search) are mandatory for the homepage shell.
  const enabledBuiltins = [...new Set(['core', ...configured])]
    .map((name) => builtins.find((location) => location.name === name))
    .filter((location): location is PluginLocation => location !== undefined)
  const enabledNames = new Set(enabledBuiltins.map((location) => location.name))
  const enabled = [...enabledBuiltins, ...externals]

  console.log(`[plugin-sync] user plugins root: ${getUserPluginsRoot()} (${USER_PLUGINS_ENV} to override)`)
  console.log(`[plugin-sync] built-in enabled: ${enabledBuiltins.map((l) => l.name).join(', ') || '(none)'}`)
  console.log(`[plugin-sync] user plugins (${externals.length}): ${externals.map((l) => l.rel).join(', ') || '(none)'}`)

  syncPluginDependencies(enabled)
  generateRegistry(enabled)
  updateTsconfig(builtins, externals, enabledNames)
}

main()
