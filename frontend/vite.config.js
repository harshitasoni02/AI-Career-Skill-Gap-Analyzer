// vite.config.js — Vite is the build tool for our React app.
// This tiny config just enables the React plugin (JSX support, fast reload).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
