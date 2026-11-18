// api.js — every call to our Flask backend lives in this ONE file.
// If the backend address ever changes, we only edit this file.

// IMPORTANT (bug fix): we build the API address from the SAME host the
// page is opened from. Browsers treat "localhost" and "127.0.0.1" as two
// DIFFERENT sites — if the app is opened on localhost but calls
// 127.0.0.1, the login cookie is rejected as a "cross-site cookie" and
// the user appears logged out everywhere. Same host = cookie works.
export const API_BASE = `http://${window.location.hostname}:5000`

// Shared logic: turn the server's JSON reply into data, or throw a
// readable error message (the backend sends {"error": "..."} on problems).
async function handle(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Server error (${res.status})`)
  return data
}

// Upload files (multipart FormData) — used for resume uploads.
export async function apiUpload(path, formData) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    body: formData,
    credentials: 'include', // send the login cookie if we have one
  })
  return handle(res)
}

// Send JSON data — used for login, register, saving results.
export async function apiJson(path, body, method = 'POST') {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  return handle(res)
}

// Simple GET request — used for /api/me, /api/my-analyses.
export async function apiGet(path) {
  const res = await fetch(API_BASE + path, { credentials: 'include' })
  return handle(res)
}
