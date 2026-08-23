import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const pluginsDir = join(root, 'src', 'plugins')
const configPath = join(pluginsDir, 'plugin.config.json')
/** Conventional location of the user plugins root (no env override). */
const userPluginsDir = join(root, 'user-plugins')

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
 * User plugins live under the user-plugins root. Both layouts are supported
 * so several repos can sit side by side:
 *   <root>/<plugin>/plugin.tsx          (depth 1)
 *   <root>/<repo>/<plugin>/plugin.tsx   (depth 2)
 */
function listExternalPlugins(): PluginLocation[] {
  if (existsSync(userPluginsDir) === false) return []

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

  for (const entry of readdirSync(userPluginsDir, { withFileTypes: true })) {
    if (entry.isDirectory() === false) continue
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    visit(join(userPluginsDir, entry.name), entry.name, 1)
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
  const enabled = [...enabledBuiltins, ...externals]

  console.log(`[plugin-sync] user plugins root: ${userPluginsDir}`)
  console.log(`[plugin-sync] built-in enabled: ${enabledBuiltins.map((l) => l.name).join(', ') || '(none)'}`)
  console.log(`[plugin-sync] user plugins (${externals.length}): ${externals.map((l) => l.rel).join(', ') || '(none)'}`)

  syncPluginDependencies(enabled)
}

main()
