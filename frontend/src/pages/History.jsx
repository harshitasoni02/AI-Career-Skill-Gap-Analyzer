// History.jsx — shows the logged-in user's saved analyses from the database.
// Each record can be EXPANDED to view its full saved details:
//   student analyses → matched / missing skills
//   recruiter screenings → the candidate ranking that was saved
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SkillChips } from '../components/SkillChips.jsx'
import { apiGet } from '../api.js'

export default function History() {
  const [analyses, setAnalyses] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/api/my-analyses')
      .then((d) => setAnalyses(d.analyses))
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="container">
        <div className="section">
          ⚠️ {error} — <Link to="/login">log in</Link> to see your history.
        </div>
      </div>
    )
  }

  if (!analyses) {
    return <div className="container"><div className="loading">Loading your history…</div></div>
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="home-kicker">Records</span>
          <h1 className="page-title">🗂️ My saved analyses</h1>
          <p className="subtitle">Everything you saved, newest first. Open a record to see its details.</p>
        </div>
      </div>

      {analyses.length === 0 && (
        <div className="section">Nothing saved yet. Run an analysis and press “Save”!</div>
      )}

      {analyses.map((a) => {
        const p = a.payload || {}
        return (
          <div className="section" key={a.id}>
            <h2>
              {a.module_type === 'student' ? '🎓 Student analysis' : '🏢 Recruiter screening'}
              <span className="badge calc">{a.score != null ? `${a.score}% match` : 'no score'}</span>
            </h2>
            <p className="note">
              #{a.id} · {a.job_title} · saved {a.created_at ? a.created_at.slice(0, 16).replace('T', ' ') : ''}
            </p>

            <details className="cand-details" style={{ marginTop: 8 }}>
              <summary>View saved details</summary>

              {a.module_type === 'student' && (
                <>
                  <p><b>✅ Matched skills at the time of saving:</b></p>
                  <SkillChips
                    items={(p.matched || []).map((n) => ({ name: n }))}
                    variant="green"
                  />
                  <p style={{ marginTop: 8 }}><b>❌ Missing skills at the time of saving:</b></p>
                  <SkillChips
                    items={(p.missing || []).map((n) => ({ name: n }))}
                    variant="red"
                  />
                  {p.score_explanation && (
                    <p className="note" style={{ marginTop: 8 }}>🧮 {p.score_explanation}</p>
                  )}
                </>
              )}

              {a.module_type === 'recruiter' && (
                <>
                  <p><b>🏆 Candidate ranking at the time of saving:</b></p>
                  <ul className="evidence-list">
                    {(p.candidates || []).map((c) => (
                      <li key={c.rank + (c.filename || '')}>
                        <b>#{c.rank}</b> {c.filename} — <b>{c.score}%</b> weighted
                        ({c.simple_score != null ? `${c.simple_score}% simple` : 'n/a'}),
                        {' '}{c.matched_count} matched / {c.missing_count} missing
                      </li>
                    ))}
                    {(p.candidates || []).length === 0 && <li>No candidate data saved.</li>}
                  </ul>
                </>
              )}

              {a.module_type === 'student' && !p.matched && (
                <p className="note">No detailed data was saved for this record.</p>
              )}
            </details>
          </div>
        )
      })}
    </div>
  )
}
