// main.jsx — the entry point of our React app.
// It mounts <App /> into the <div id="root"> in index.html,
// and wraps everything in BrowserRouter so page routing works.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/literata/wght.css'
import '@fontsource-variable/instrument-sans/wght.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
