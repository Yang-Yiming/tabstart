import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PluginHost } from './plugins/PluginHost'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PluginHost>
      <App />
    </PluginHost>
  </StrictMode>,
)
