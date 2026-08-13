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
| Gauge | Generic "query & display" widget: fetch a JSON API and render fields, with per-preset settings and filter expressions |

> Gauge: presets like **DeepSeek Balance** ship with default config; add your API key in Settings → Widgets → Gauge. Keys are stored only in your local browser storage. The manifest requests `<all_urls>` host permission so custom URLs can be fetched; check the code if you prefer a narrower allow-list.

> Tasks and Kanban share drag & drop — drag a task between the two widgets and it moves across (completion state follows).

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
