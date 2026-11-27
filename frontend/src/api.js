// api.js — every call to our Flask backend lives in this ONE file.
// If the backend address ever changes, we only edit this file.
import { DEMO_MODE } from './config.js'

// In production the backend can live on another origin, supplied at build
// time. Locally we keep the original same-host rule so session cookies work:
// browsers treat "localhost" and "127.0.0.1" as different sites.
const CONFIGURED_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
export const API_BASE = CONFIGURED_BASE || `http://${window.location.hostname}:5000`

// The public demo has no session or cookies, so cross-origin requests use
// ordinary (non-credentialed) CORS. The full app keeps cookies.
const CREDENTIALS = DEMO_MODE ? 'omit' : 'include'

// Shared logic: turn the server's JSON reply into data, or throw a
// readable error message (the backend sends {"error": "..."} on problems).
async function handle(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`)
  return data
}

// ---------------------------------------------------------------------------
// Local analysis engine (demo build only)
// ---------------------------------------------------------------------------
// The public demo runs the whole scoring engine in the browser, so it needs no
// server. These imports are dynamic and demo-only, which keeps pdfjs and the
// engine out of the bundle when a real VITE_API_BASE is configured.
async function runLocalAnalysis(path, formData) {
  const [{ analyzeResume, screenCandidates }, { readPdfText }] = await Promise.all([
    import('./engine/analyze.js'),
    import('./engine/pdfText.js'),
  ])

  const jd = formData.get('job_description') || ''
  const jobTitle = formData.get('job_title') || ''

  if (path.includes('analyze-resume')) {
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      throw new Error('No file received. Make sure a PDF is selected.')
    }
    const parsed = await readPdfText(file)
    return analyzeResume(parsed, jd, jobTitle)
  }

  if (path.includes('screen-candidates')) {
    const files = formData.getAll('files').filter((f) => typeof f !== 'string')
    if (files.length === 0) {
      throw new Error('Please upload at least one résumé PDF.')
    }
    if (files.length > 20) {
      throw new Error('Please upload at most 20 résumés at once.')
    }

    // Read every PDF, keeping per-file failures so one bad scan does not sink
    // the whole screening. The engine reports them in `errors`.
    const parsed = []
    for (const file of files) {
      try {
        parsed.push(await readPdfText(file))
      } catch (err) {
        parsed.push({ text: '', pages: 0, filename: file.name, readError: err.message })
      }
    }
    return screenCandidates(parsed, jd, jobTitle)
  }

  throw new Error(`No local handler for ${path}.`)
}

// Upload files (multipart FormData) — used for résumé uploads.
export async function apiUpload(path, formData) {
  // Demo build: the analysis runs locally, so there is nothing to POST.
  if (DEMO_MODE && /analyze-resume|screen-candidates/.test(path)) {
    return runLocalAnalysis(path, formData)
  }

  const res = await fetch(API_BASE + path, {
    method: 'POST',
    body: formData,
    credentials: CREDENTIALS,
  })
  return handle(res)
}

// Send JSON data — used for login, register, saving results.
export async function apiJson(path, body, method = 'POST') {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: CREDENTIALS,
  })
  return handle(res)
}

// Simple GET request — used for /api/me, /api/my-analyses.
export async function apiGet(path) {
  const res = await fetch(API_BASE + path, { credentials: CREDENTIALS })
  return handle(res)
}
