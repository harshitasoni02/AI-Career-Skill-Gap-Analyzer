// RecruiterResults.jsx — ranked candidate screening report.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CandidateBarChart from '../components/CandidateBarChart.jsx'
import { SkillChips, EvidenceList } from '../components/SkillChips.jsx'
import { apiGet, apiJson } from '../api.js'

export default function RecruiterResults() {
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('recruiterResult')
      if (raw) setData(JSON.parse(raw))
    } catch {
      setData(null)
    }
    apiGet('/api/me').then((d) => setUser(d.user)).catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="container">
        <div className="section">
          No results found. <Link to="/recruiter">Run a screening first.</Link>
        </div>
      </div>
    )
  }

  const avgScore = data.candidates.length
    ? Math.round(data.candidates.reduce((s, c) => s + c.score, 0) / data.candidates.length)
    : 0

  async function saveScreening() {
    try {
      const res = await apiJson('/api/save-analysis', {
        module_type: 'recruiter',
        job_title: data.job.title,
        score: avgScore,
        payload: {
          candidates: data.candidates.map((c) => ({
            rank: c.rank,
            filename: c.filename,
            score: c.score,
            simple_score: c.simple_score,
            matched_count: c.matched_count,
            missing_count: c.missing_count,
          })),
        },
      })
      setSaveMsg(`✅ Screening saved to your history (record #${res.id}).`)
    } catch (err) {
      setSaveMsg('⚠️ ' + err.message)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">📋 Candidate Screening Report</h1>
      <p className="subtitle">Role: {data.job.title} · {data.candidates.length} candidate(s)</p>

      <div className="section">
        <h2>📌 Required skills for this job <span className="badge extracted">EXTRACTED FROM JD</span></h2>
        <SkillChips items={data.job.required_skills} variant="gray" />
        {data.job.ai_detected_jd_terms && data.job.ai_detected_jd_terms.length > 0 && (
          <>
            <h2 style={{ marginTop: 14, fontSize: 15 }}>
              🤖 Possible extra requirements <span className="badge ai">AI-DETECTED (spaCy) — HUMAN REVIEW</span>
            </h2>
            <SkillChips
              items={data.job.ai_detected_jd_terms.map((t) => ({ name: t, category: 'AI-detected' }))}
              variant="amber"
            />
            <p className="note" style={{ marginTop: 8 }}>
              These terms were spotted by AI in the job description but are not in our
              verified skill dictionary — they do NOT affect scores.
            </p>
          </>
        )}
      </div>

      <div className="section">
        <h2>📊 Score comparison <span className="badge calc">WEIGHTED SCORES</span></h2>
        <CandidateBarChart candidates={data.candidates} />
      </div>

      <div className="section">
        <h2>🏆 Ranked candidates <span className="badge calc">RANKED — FORMULA SHOWN</span></h2>
        <p className="note">{data.ranking_explanation}</p>

        <div style={{ overflowX: 'auto' }}>
        <table className="rtable">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Candidate</th>
              <th>Weighted match</th>
              <th>Matched</th>
              <th>Missing</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates.map((c) => (
              <tr key={c.filename + c.rank}>
                <td>
                  <span className={'rank-badge' + (c.rank === 1 ? ' top' : '')}>{c.rank}</span>
                </td>
                <td>
                  <b>{c.parsed_name || 'Name not detected'}</b>
                  <div className="note">{c.filename}</div>
                </td>
                <td>
                  <b>{c.score}%</b> <span className="note">weighted</span>
                  <div className="scorebar"><div style={{ width: `${c.score}%` }} /></div>
                  <div className="note">simple coverage: {c.simple_score}%</div>
                </td>
                <td>{c.matched_count}</td>
                <td>{c.missing_count}</td>
                <td>
                  <details className="cand-details">
                    <summary>Open screening details</summary>
                    <p><b>✅ Matched skills + evidence:</b></p>
                    <EvidenceList items={c.matched} />
                    <p><b>❌ Missing skills:</b></p>
                    <SkillChips items={c.missing} variant="red" />
                    {c.top_extra.length > 0 && (
                      <>
                        <p><b>⭐ Extra skills beyond the job:</b></p>
                        <p className="note">{c.top_extra.join(', ')}</p>
                      </>
                    )}
                    {c.semantic_possible_matches.length > 0 && (
                      <>
                        <p><b>🧠 AI-estimated possible matches (human review):</b></p>
                        <ul className="evidence-list">
                          {c.semantic_possible_matches.map((m) => (
                            <li key={m.missing_skill}>
                              Needs <b>{m.missing_skill}</b>; resume shows <b>{m.resume_skill}</b> ({m.similarity}%)
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {data.errors.length > 0 && (
          <div className="error-box" style={{ marginTop: 12 }}>
            Some files could not be processed: {data.errors.map((e) => `${e.filename} (${e.error})`).join('; ')}
          </div>
        )}
      </div>

      <div className="section">
        {user ? (
          <>
            <button className="btn btn-small" onClick={saveScreening}>💾 Save screening to my history</button>
            {saveMsg && <p className="note">{saveMsg}</p>}
          </>
        ) : (
          <p className="note">
            Want to keep this report? <Link to="/login">Log in</Link> first, then save.
          </p>
        )}
      </div>
    </div>
  )
}
