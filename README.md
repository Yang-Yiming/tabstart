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
`plugin.tsx` (metadata + settings schema) and the component file(s). The registry auto-discovers every
folder with a `plugin.tsx` via `import.meta.glob` — no manual registration.

- The **plugin manager** (top-right) lists all plugins with enable/disable toggles. Disabling hides a
  plugin from the grid and the Add-Widget picker, but its layout position is preserved.
- `deepseek` and `example` are preset plugins; `example` is a copyable template.
- Keys (API keys, etc.) are stored only in your local browser storage.

### Writing your own plugin

1. Copy `src/plugins/example/` and rename the folder (e.g. `src/plugins/myplugin/`).
2. Edit `plugin.tsx`: change `id`, `name`, grid size (`defaultW/H`, `minW/H`), `order` and the
   `settings` schema (fields render automatically in Settings → Widgets).
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
