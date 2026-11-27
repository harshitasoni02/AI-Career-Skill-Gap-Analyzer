// StudentResults.jsx — the skill gap analysis report, read as a document.
// The page itself is viewport-fitted; the report column scrolls on its own.
// Sections are labelled so readers always know whether they are looking at
// extracted facts, a calculated score, or AI-generated guidance.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ScoreChart from '../components/ScoreChart.jsx'
import { SkillChips, EvidenceList } from '../components/SkillChips.jsx'
import { RailStack } from '../components/Scene3D.jsx'
import { apiGet, apiJson } from '../api.js'
import { DEMO_MODE } from '../config.js'

export default function StudentResults() {
  const [data, setData] = useState(null)
  const [user, setUser] = useState(null)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('studentResult')
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
          <h2>No report yet</h2>
          <p className="note">Run an analysis first, then this page will show the full report.</p>
          <Link to="/student" className="btn">Start an analysis</Link>
        </div>
      </div>
    )
  }

  const a = data.analysis
  const ex = data.extracted
  const ai = data.ai_generated
  const info = ex.resume_info || {}
  const sections = ex.resume_sections || {}

  async function saveResult() {
    try {
      const res = await apiJson('/api/save-analysis', {
        module_type: 'student',
        job_title: a.job_title,
        score: a.score,
        payload: {
          matched: a.matched.map((m) => m.name),
          missing: a.missing.map((m) => m.name),
          score_explanation: a.score_explanation,
        },
      })
      setSaveMsg(`Saved to your history (record #${res.id}).`)
    } catch (err) {
      setSaveMsg(err.message)
    }
  }

  return (
    <div className="page report report-page">
      <header className="page-head report-head">
        <div>
          <div className="page-kicker">Analysis report</div>
          <h1 className="page-title">Skill gap report</h1>
          <p className="subtitle">{a.job_title}</p>
        </div>

        <div className="report-meta">
          <span>Prepared for {info.name || (user && user.name) || 'you'}</span>
          <span>{ex.filename}</span>
          <span>{ex.pages} page{ex.pages === 1 ? '' : 's'}</span>
          <span>{a.score}% weighted</span>
        </div>
      </header>

      <div className="report-shell">
        <aside className="report-rail">
          <div className="rail-block">
            <div className="rail-label">In this report</div>
            <nav className="rail-nav">
              <a href="#score">Skill match score</a>
              <a href="#extracted">Extracted information</a>
              <a href="#matched">Matched skills</a>
              <a href="#missing">Missing skills</a>
              <a href="#extra">Extra skills</a>
              <a href="#advice">Suggestions and roadmap</a>
            </nav>
          </div>

          <div className="rail-block">
            <div className="rail-label">Source document</div>
            <RailStack />
            <p className="note">
              {ex.filename}
              <br />
              {ex.pages} page{ex.pages === 1 ? '' : 's'} · {ex.characters} characters
            </p>
          </div>

          <p className="note rail-note">
            Evidence first. AI estimates are labelled and kept out of the score.
          </p>
        </aside>

        <div className="report-doc">
          {/* ---------- Score (calculated, transparent) ---------- */}
          <section className="section score-section" id="score">
            <h2>Skill match score <span className="badge calc">Calculated · formula shown</span></h2>
            <div className="score-wrap">
              <ScoreChart score={a.score} />
              <div>
                <div className="score-expl">{a.score_explanation}</div>
                <div className="score-expl">
                  Simple coverage: {a.simple_score}% — {a.simple_score_explanation}
                </div>
                {a.weights_used && (
                  <div className="score-expl">
                    Weights used:{' '}
                    {Object.entries(a.weights_used)
                      .map(([cat, w]) => `${cat}: ${w}`)
                      .join(' · ')}
                  </div>
                )}
                {Object.entries(a.category_breakdown).map(([cat, b]) => (
                  <div className="cat-bar-row" key={cat}>
                    <div className="cat-name">{cat}</div>
                    <div className="cat-bar">
                      <div style={{ width: `${(b.matched / b.total) * 100}%` }} />
                    </div>
                    <div className="cat-count">{b.matched}/{b.total}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- Extracted information ---------- */}
          <section className="section" id="extracted">
            <h2>Information extracted from your résumé <span className="badge extracted">Extracted · with evidence</span></h2>
            <ul className="evidence-list">
              <li><b>Name (estimated):</b> {info.name || 'Not detected'} {info.name_note ? `— ${info.name_note}` : ''}</li>
              <li><b>Email:</b> {info.email || 'Not detected'}</li>
              <li><b>Phone:</b> {info.phone || 'Not detected'}</li>
              <li><b>LinkedIn:</b> {info.linkedin || 'Not detected'}</li>
              <li><b>File:</b> {ex.filename} · {ex.pages} page(s) · {ex.characters} characters</li>
            </ul>
            <p className="note" style={{ marginTop: 14 }}>All {ex.resume_skills.length} skills found in your résumé:</p>
            <SkillChips items={ex.resume_skills} variant="gray" />
            {Object.keys(sections).length > 0 && (
              <>
                <p className="note" style={{ marginTop: 14 }}>Sections detected in your résumé:</p>
                {Object.entries(sections).map(([name, content]) => (
                  <details key={name} className="cand-details" style={{ marginTop: 6 }}>
                    <summary style={{ textTransform: 'capitalize' }}>{name}</summary>
                    <pre className="score-expl" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--sans)' }}>{content}</pre>
                  </details>
                ))}
              </>
            )}
          </section>

          {/* ---------- Matched / missing / extra ---------- */}
          <section className="section" id="matched">
            <h2>Matched skills ({a.matched.length}) <span className="badge extracted">Extracted · with evidence</span></h2>
            <SkillChips items={a.matched} variant="green" />
            <EvidenceList items={a.matched} />
          </section>

          <section className="section" id="missing">
            <h2>Missing skills ({a.missing.length}) <span className="badge calc">Not found in résumé</span></h2>
            <SkillChips items={a.missing} variant="red" />
            <p className="note" style={{ marginTop: 10 }}>
              “Missing” means the exact words were not found in your résumé text. It
              does not automatically mean you lack the skill.
            </p>
          </section>

          <section className="section" id="extra">
            <h2>Extra skills you have beyond this role ({a.extra.length})</h2>
            <SkillChips items={a.extra} variant="gray" />
          </section>

          {/* ---------- AI-detected extra JD requirements ---------- */}
          {a.ai_detected_note && (
            <section className="section">
              <h2>Possible extra requirements in this job <span className="badge ai">AI-detected · human review</span></h2>
              <SkillChips
                items={a.ai_detected_jd_terms.map((t) => ({ name: t, category: 'AI-detected' }))}
                variant="amber"
              />
              <p className="note" style={{ marginTop: 10 }}>{a.ai_detected_note}</p>
            </section>
          )}

          {/* ---------- Semantic possible matches (AI-estimated) ---------- */}
          {a.semantic_note && (
            <section className="section">
              <h2>Possible matches found by meaning <span className="badge ai">AI-estimated · human review</span></h2>
              <ul className="evidence-list">
                {a.semantic_possible_matches.map((m) => (
                  <li key={m.missing_skill}>
                    Job needs <b>{m.missing_skill}</b>; your résumé shows <b>{m.resume_skill}</b>
                    {' '}({m.similarity}% similar) — “{m.resume_evidence}”
                  </li>
                ))}
              </ul>
              <p className="note" style={{ marginTop: 10 }}>{a.semantic_note}</p>
            </section>
          )}

          {/* ---------- AI-generated advice ---------- */}
          <section className="section" id="advice">
            <h2>Resume improvement suggestions <span className="badge ai">AI-generated advice</span></h2>
            <ul className="list-plain">
              {ai.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              {ai.suggestions.length === 0 && <li>Nothing to suggest — the résumé covers the role well.</li>}
            </ul>
            <p className="note" style={{ marginTop: 8 }}>{ai.label}</p>
          </section>

          <section className="section">
            <h2>Your learning roadmap <span className="badge ai">AI-generated advice</span></h2>
            {ai.roadmap.map((phase) => (
              <div className="phase" key={phase.phase}>
                <h3>{phase.title}</h3>
                <p className="why">{phase.why}</p>
                {phase.empty_note ? (
                  <p className="note">{phase.empty_note}</p>
                ) : (
                  <ul>
                    {phase.skills.map((s) => (
                      <li key={s.skill}>
                        <b>{s.skill}</b>
                        <i>{s.resource_hints.join(' · ')}</i>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>

          {/* ---------- Save + disclaimer ---------- */}
          <section className="section" id="save">
            {DEMO_MODE ? (
              <p className="note">
                This is the public demo, so reports are not saved. Print or
                screenshot this page if you want to keep it.
              </p>
            ) : user ? (
              <>
                <button className="btn btn-small" onClick={saveResult}>Save to my history</button>
                {saveMsg && <p className="note" style={{ marginTop: 8 }}>{saveMsg}</p>}
              </>
            ) : (
              <p className="note">
                Want to keep this report? <Link to="/login">Log in</Link> (or{' '}
                <Link to="/register">register</Link>) and use the save button.
              </p>
            )}
            <div className="disclaimer">{data.disclaimer}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
