# tabstart

A personal browser start page & launchpad dashboard for your new tab.

## Widgets

| Widget | Description |
| --- | --- |
| Bookmarks | Editable bookmark grid |
| Quick Notes | Scratchpad notes |
| Heatmap | Activity heatmap |
| Streak | Win/loss streak tracker |
| Tasks (Todo) | Daily / weekly tasks & goals with recurrence |
| Kanban | 3-column board (drag & drop) + compact list with keyboard shortcuts (`j`/`k` select, `[`/`]` move, `Enter` done) |
| Pomodoro | Small / large timer variants |
| DeepSeek | Hardcoded DeepSeek API balance plugin (preset; add your API key in Settings → Widgets → DeepSeek Balance) |

> Tasks and Kanban share drag & drop — drag a task between the two widgets and it moves across (completion state follows).

## Plugins

Every grid widget is a **plugin**. Built-in widgets ship under `src/plugins/<id>/`; each folder contains a
`plugin.tsx` (metadata + `apply` hook) and the component file(s). The registry auto-discovers every
folder with a `plugin.tsx` via `import.meta.glob` — no manual registration.

The plugin runtime is a small Cordis-style core: each plugin exports an `apply(ctx)` function and can
contribute widgets, UI slots, or themes through `ctx.widgets` / `ctx.slots` / `ctx.themes`. Plugins are
discovered at build time and mounted at runtime; MV3-safe, no remote code loading.

- The **plugin manager** (top-right) lists all plugins with enable/disable toggles. Disabling hides a
  plugin from the grid and the Add-Widget picker, but its layout position is preserved.
- `deepseek` and `example` are preset plugins; `example` is a copyable template.
- Keys (API keys, etc.) are stored only in your local browser storage.

### Mini-Cordis runtime

`src/plugins/runtime.ts` is a small Cordis-style core. It does **not** load remote code; discovery stays
build-time and MV3-safe.

- **`HomepageContext`** — `effect()`, `on() / emit()`, `plugin()`, `get() / provide()` plus built-in registries.
- **`WidgetRegistry` / `SlotRegistry` / `ThemeRegistry`** — the three built-in extension surfaces.
- **`PluginFiber`** — one mounted plugin instance; `dispose()` rolls back every effect registered during `apply()`.
- **`defineWidgetPlugin(widget)`** — the fast path for the common “one plugin = one grid widget” case.

Runtime flow:

```text
registry.ts (import.meta.glob, build-time)
  → PluginHost mounts enabled plugins
    → apply(ctx) registers widgets / slots / themes
      → Dashboard / Slot / ThemeApplier consume registries
```

Built-in slot names: `hero.clock` and `hero.search` (provided by `src/plugins/core/plugin.tsx`).
The active plugin theme is persisted in `homepage-active-theme`; `src/plugins/liquid-glass/` is a
theme-plugin example and can be selected in Settings → Appearance.

### Writing your own plugin

1. Copy `src/plugins/example/` and rename the folder (e.g. `src/plugins/myplugin/`).
2. Edit `plugin.tsx`: change the widget `id`, `name`, grid size (`defaultW/H`, `minW/H`), `order` and the
   `settings` schema (fields render automatically in Settings → Widgets). Export it with
   `export const plugins = [defineWidgetPlugin(widget)]`.
3. Rewrite the component. Available APIs: `WidgetCard`, `useWidgetSettings(widgetKey)` (persisted to
   local storage), and props `{ widgetKey, preview, compact }`.
4. If the plugin fetches a remote API, add the host to `host_permissions` in `public/manifest.json`
   (MV3 needs a static allow-list — there is no runtime prompt).
5. Rebuild (`bun run build:extension`) — the plugin appears in the picker and the manager automatically.

### Legacy key migration

The old `Gauge` widget and its presets were removed. On first load after upgrading, stored layout and
setting keys are rewritten automatically: `gauge:deepseek-balance` → `deepseek` (your API key carries
over), `kanban:full` / `kanban:compact` → `kanban-full` / `kanban-compact`, `pomodoro:*` →
`pomodoro-*`; `gauge:custom` instances are dropped.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 3
- react-grid-layout
- Lucide Icons

## Getting Started

### install to your browser (Edge/Chrome)
```bash
bun install
bun run build:extension
```
load `dist` folder as an unpacked extension in your browser

### check the lookings
```bash
bun install
bun run dev
```

## preview

![](public/assets/tabstart.jpg)

## License

MIT
