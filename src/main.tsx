import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadWebFonts } from './lib/webFonts'
import { PluginHost } from './plugins/PluginHost'

// Kick the (non-blocking) font request off in parallel with the first render.
void loadWebFonts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginHost>
      <App />
    </PluginHost>
  </StrictMode>,
)
