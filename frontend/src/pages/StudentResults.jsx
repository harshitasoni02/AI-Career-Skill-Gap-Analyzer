// StudentResults.jsx — the skill gap analysis results page.
// IMPORTANT: sections are labeled so users always know whether they are
// looking at EXTRACTED facts, a CALCULATED score, or AI-GENERATED advice.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ScoreChart from '../components/ScoreChart.jsx'
import { SkillChips, EvidenceList } from '../components/SkillChips.jsx'
import { apiGet, apiJson } from '../api.js'

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
      <div className="container">
        <div className="section">
          No results found. <Link to="/student">Run an analysis first.</Link>
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
      setSaveMsg(`✅ Saved to your history (record #${res.id}).`)
    } catch (err) {
      setSaveMsg('⚠️ ' + err.message)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">📊 Skill Gap Analysis</h1>
      <p className="subtitle">Role: {a.job_title}</p>

      {/* ---------- Score (calculated, transparent) ---------- */}
      <div className="section">
        <h2>🎯 Skill Match Score <span className="badge calc">CALCULATED — WEIGHTED</span></h2>
        <div className="score-wrap">
          <ScoreChart score={a.score} />
          <div style={{ flex: 1, minWidth: 240 }}>
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
      </div>

      {/* ---------- Extracted info ---------- */}
      <div className="section">
        <h2>🧾 Information extracted from your resume <span className="badge extracted">EXTRACTED — WITH EVIDENCE</span></h2>
        <ul className="evidence-list">
          <li><b>Name (estimated):</b> {info.name || 'Not detected'} {info.name_note ? `— ${info.name_note}` : ''}</li>
          <li><b>Email:</b> {info.email || 'Not detected'}</li>
          <li><b>Phone:</b> {info.phone || 'Not detected'}</li>
          <li><b>LinkedIn:</b> {info.linkedin || 'Not detected'}</li>
          <li><b>File:</b> {ex.filename} · {ex.pages} page(s) · {ex.characters} characters</li>
        </ul>
        <p className="note">All {ex.resume_skills.length} skills found in your resume: </p>
        <SkillChips items={ex.resume_skills} variant="gray" />
        {Object.keys(sections).length > 0 && (
          <>
            <p className="note" style={{ marginTop: 14 }}>📄 Sections detected in your resume:</p>
            {Object.entries(sections).map(([name, content]) => (
              <details key={name} className="cand-details" style={{ marginTop: 6 }}>
                <summary style={{ textTransform: 'capitalize' }}>📂 {name}</summary>
                <pre className="score-expl" style={{ whiteSpace: 'pre-wrap' }}>{content}</pre>
              </details>
            ))}
          </>
        )}
      </div>

      {/* ---------- Matched / missing / extra ---------- */}
      <div className="section">
        <h2>✅ Matched skills ({a.matched.length}) <span className="badge extracted">EXTRACTED — WITH EVIDENCE</span></h2>
        <SkillChips items={a.matched} variant="green" />
        <EvidenceList items={a.matched} />
      </div>

      <div className="section">
        <h2>❌ Missing skills ({a.missing.length}) <span className="badge calc">NOT FOUND IN RESUME</span></h2>
        <SkillChips items={a.missing} variant="red" />
        <p className="note" style={{ marginTop: 10 }}>
          "Missing" means the exact words were not found in your resume text —
          it does not automatically mean you lack the skill.
        </p>
      </div>

      <div className="section">
        <h2>⭐ Extra skills you have beyond this job ({a.extra.length})</h2>
        <SkillChips items={a.extra} variant="gray" />
      </div>

      {/* ---------- AI-detected extra JD requirements ---------- */}
      {a.ai_detected_note && (
        <div className="section">
          <h2>🤖 Possible extra requirements in this job <span className="badge ai">AI-DETECTED (spaCy) — HUMAN REVIEW</span></h2>
          <SkillChips
            items={a.ai_detected_jd_terms.map((t) => ({ name: t, category: 'AI-detected' }))}
            variant="amber"
          />
          <p className="note" style={{ marginTop: 8 }}>{a.ai_detected_note}</p>
        </div>
      )}

      {/* ---------- Semantic possible matches (AI-estimated) ---------- */}
      {a.semantic_note && (
        <div className="section">
          <h2>🧠 Possible matches found by meaning <span className="badge ai">AI-ESTIMATED — HUMAN REVIEW</span></h2>
          <ul className="evidence-list">
            {a.semantic_possible_matches.map((m) => (
              <li key={m.missing_skill}>
                Job needs <b>{m.missing_skill}</b>; your resume shows <b>{m.resume_skill}</b>
                {' '}({m.similarity}% similar) — “{m.resume_evidence}”
              </li>
            ))}
          </ul>
          <p className="note">{a.semantic_note}</p>
        </div>
      )}

      {/* ---------- AI-generated advice ---------- */}
      <div className="section">
        <h2>💡 Resume improvement suggestions</h2>
        <ul className="list-plain">
          {ai.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          {ai.suggestions.length === 0 && <li>Nothing to suggest — nice resume! 🎉</li>}
        </ul>
        <p className="note" style={{ marginTop: 8 }}>{ai.label}</p>
      </div>

      <div className="section">
        <h2>🗺️ Your learning roadmap</h2>
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
      </div>

      {/* ---------- Save + disclaimer ---------- */}
      <div className="section">
        {user ? (
          <>
            <button className="btn btn-small" onClick={saveResult}>💾 Save to my history</button>
            {saveMsg && <p className="note">{saveMsg}</p>}
          </>
        ) : (
          <p className="note">
            Want to keep this result? <Link to="/login">Log in</Link> (or{' '}
            <Link to="/register">register</Link>) and use the save button.
          </p>
        )}
      </div>
    </div>
  )
}
