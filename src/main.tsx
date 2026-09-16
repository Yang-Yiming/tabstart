import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initFontFamily } from './lib/webFonts'
import { PluginHost } from './plugins/PluginHost'

// Resolve the stored font choice before the first paint, so the page never
// renders in one stack and swaps to the other a commit later.
void initFontFamily()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginHost>
      <App />
    </PluginHost>
  </StrictMode>,
)
