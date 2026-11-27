// config.js — the few build-time switches shared by the app.
// The public demo is a reduced build: no accounts, no saved history, and
// smaller upload limits that fit inside a Vercel function request.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export const MAX_UPLOAD_MB = DEMO_MODE ? 4 : 20
export const MAX_CANDIDATES = DEMO_MODE ? 3 : 20
