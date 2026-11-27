// RecruiterResults.jsx — ranked candidate screening report.
// The page is fixed to the viewport; the report column does the scrolling.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CandidateBarChart from '../components/CandidateBarChart.jsx'
import { SkillChips, EvidenceList } from '../components/SkillChips.jsx'
import { RailStack } from '../components/Scene3D.jsx'
import { apiGet, apiJson } from '../api.js'
import { DEMO_MODE } from '../config.js'

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
      <div className="page">
        <div className="empty-state">
          <h2>No screening yet</h2>
          <p className="note">Run a screening first, then this page will show the ranked report.</p>
          <Link to="/recruiter" className="btn">Start a screening</Link>
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
      setSaveMsg(`Screening saved to your history (record #${res.id}).`)
    } catch (err) {
      setSaveMsg(err.message)
    }
  }

  return (
    <div className="page report report-page">
      <header className="page-head report-head">
        <div>
          <div className="page-kicker">Screening report</div>
          <h1 className="page-title">Candidate screening report</h1>
          <p className="subtitle">
            {data.job.title} · {data.candidates.length} candidate(s)
          </p>
        </div>

        <div className="report-meta">
          <span>Ranked by weighted match</span>
          <span>{data.candidates.length} résumé{data.candidates.length === 1 ? '' : 's'}</span>
          <span>Average score {avgScore}%</span>
          <span>Human review required</span>
        </div>
      </header>

      <div className="report-shell">
        <aside className="report-rail">
          <div className="rail-block">
            <div className="rail-label">In this report</div>
            <nav className="rail-nav">
              <a href="#required">Required skills</a>
              <a href="#comparison">Score comparison</a>
              <a href="#ranking">Ranked candidates</a>
              <a href="#save">Save this screening</a>
            </nav>
          </div>

          <div className="rail-block">
            <div className="rail-label">Screening</div>
            <RailStack />
            <p className="note">
              {data.candidates.length} résumé{data.candidates.length === 1 ? '' : 's'}
              <br />
              Average weighted score {avgScore}%
            </p>
          </div>

          <p className="note rail-note">
            Scores support human review. Read each original résumé before deciding.
          </p>
        </aside>

        <div className="report-doc">
          <section className="section" id="required">
            <h2>Required skills for this job <span className="badge extracted">Extracted from JD</span></h2>
            <SkillChips items={data.job.required_skills} variant="gray" />
            {data.job.ai_detected_jd_terms && data.job.ai_detected_jd_terms.length > 0 && (
              <>
                <h2 style={{ marginTop: 18, fontSize: 17 }}>
                  Possible extra requirements <span className="badge ai">AI-detected · human review</span>
                </h2>
                <SkillChips
                  items={data.job.ai_detected_jd_terms.map((t) => ({ name: t, category: 'AI-detected' }))}
                  variant="amber"
                />
                <p className="note" style={{ marginTop: 8 }}>
                  These terms were spotted by AI in the job description but are not in
                  our verified skill dictionary. They do not affect scores.
                </p>
              </>
            )}
          </section>

          <section className="section" id="comparison">
            <h2>Score comparison <span className="badge calc">Weighted scores</span></h2>
            <CandidateBarChart candidates={data.candidates} />
          </section>

          <section className="section" id="ranking">
            <h2>Ranked candidates <span className="badge calc">Ranked · formula shown</span></h2>
            <p className="note">{data.ranking_explanation}</p>

            <div className="table-wrap">
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
                          <p><b>Matched skills + evidence</b></p>
                          <EvidenceList items={c.matched} />
                          <p><b>Missing skills</b></p>
                          <SkillChips items={c.missing} variant="red" />
                          {c.top_extra.length > 0 && (
                            <>
                              <p><b>Extra skills beyond the job</b></p>
                              <p className="note">{c.top_extra.join(', ')}</p>
                            </>
                          )}
                          {c.semantic_possible_matches.length > 0 && (
                            <>
                              <p><b>AI-estimated possible matches (human review)</b></p>
                              <ul className="evidence-list">
                                {c.semantic_possible_matches.map((m) => (
                                  <li key={m.missing_skill}>
                                    Needs <b>{m.missing_skill}</b>; résumé shows <b>{m.resume_skill}</b> ({m.similarity}%)
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
          </section>

          <section className="section" id="save">
            {DEMO_MODE ? (
              <p className="note">
                This is the public demo, so screenings are not saved. Print or
                screenshot this page if you want to keep it.
              </p>
            ) : user ? (
              <>
                <button className="btn btn-small" onClick={saveScreening}>Save screening to my history</button>
                {saveMsg && <p className="note" style={{ marginTop: 8 }}>{saveMsg}</p>}
              </>
            ) : (
              <p className="note">
                Want to keep this report? <Link to="/login">Log in</Link> first, then save.
              </p>
            )}
            <div className="disclaimer">{data.disclaimer}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
