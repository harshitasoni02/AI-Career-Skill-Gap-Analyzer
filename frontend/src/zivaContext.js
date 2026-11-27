// zivaContext.js — a tiny, session-only bridge between a report and Ziva.
// The public demo has no account or saved report, so the latest analysis is
// kept in sessionStorage and sent only when the visitor asks Ziva a question.
const KEY = 'zivaContext'

export function rememberStudentContext(analysis) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      kind: 'student',
      job_title: analysis.job_title,
      score: analysis.score,
      matched: (analysis.matched || []).map((m) => m.name).slice(0, 16),
      missing: (analysis.missing || []).map((m) => m.name).slice(0, 16),
    }))
  } catch {
    /* sessionStorage may be unavailable; the chat still works without context */
  }
}

export function rememberRecruiterContext(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      kind: 'recruiter',
      job_title: data.job?.title,
      candidates: (data.candidates || []).slice(0, 8).map((c) => ({
        name: c.parsed_name || c.filename,
        score: c.score,
      })),
      required: (data.job?.required_skills || []).map((s) => s.name).slice(0, 16),
    }))
  } catch {
    /* the chat still works without context */
  }
}

export function readZivaContext() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
