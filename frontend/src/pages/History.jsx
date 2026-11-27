// History.jsx — the logged-in user's saved analyses, read as a quiet ledger.
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
      <div className="page">
        <div className="empty-state">
          <h2>History is private</h2>
          <p className="note">{error} — <Link to="/login">log in</Link> to see your saved analyses.</p>
        </div>
      </div>
    )
  }

  if (!analyses) {
    return <div className="page"><div className="loading">Loading your history…</div></div>
  }

  return (
    <div className="page ledger">
      <header className="page-head">
        <div className="page-kicker">Your archive</div>
        <h1 className="page-title">Saved analyses</h1>
        <p className="subtitle">Everything you saved, newest first. Open a record to see its details.</p>
      </header>

      <div className="ledger-body scroll-pane">
        {analyses.length === 0 && (
          <div className="empty-state">
            <h2>Nothing saved yet</h2>
            <p className="note">Run an analysis and use the save button to keep the report here.</p>
            <Link to="/student" className="btn">Analyze a résumé</Link>
          </div>
        )}

        {analyses.map((a) => {
          const p = a.payload || {}
          return (
            <div className="section" key={a.id}>
              <h2>
                {a.module_type === 'student' ? 'Student analysis' : 'Recruiter screening'}
                <span className="badge calc">{a.score != null ? `${a.score}% match` : 'No score'}</span>
              </h2>
              <p className="note">
                #{a.id} · {a.job_title} · saved {a.created_at ? a.created_at.slice(0, 16).replace('T', ' ') : ''}
              </p>

              <details className="cand-details" style={{ marginTop: 8 }}>
                <summary>View saved details</summary>

                {a.module_type === 'student' && (
                  <>
                    <p><b>Matched skills at the time of saving</b></p>
                    <SkillChips
                      items={(p.matched || []).map((n) => ({ name: n }))}
                      variant="green"
                    />
                    <p style={{ marginTop: 10 }}><b>Missing skills at the time of saving</b></p>
                    <SkillChips
                      items={(p.missing || []).map((n) => ({ name: n }))}
                      variant="red"
                    />
                    {p.score_explanation && (
                      <p className="note" style={{ marginTop: 10 }}>{p.score_explanation}</p>
                    )}
                  </>
                )}

                {a.module_type === 'recruiter' && (
                  <>
                    <p><b>Candidate ranking at the time of saving</b></p>
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
    </div>
  )
}
