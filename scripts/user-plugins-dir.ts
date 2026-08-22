import { resolve } from 'node:path'

export const USER_PLUGINS_ENV = 'TABSTART_USER_PLUGINS'

/**
 * Absolute path to the user-plugins root (override with TABSTART_USER_PLUGINS).
 * Both bun scripts and vite load with cwd = repo root, so cwd-based
 * resolution stays stable across both entry points.
 */
export function getUserPluginsRoot(): string {
  const override = process.env[USER_PLUGINS_ENV]?.trim()
  return resolve(override ? override : 'user-plugins')
}
