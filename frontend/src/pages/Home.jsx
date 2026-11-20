// Home.jsx — landing page following the Stitch home design:
// gradient hero with metrics ribbon + numbered "how it works" steps.
// Navigation to both agents happens via the hero buttons and sidebar.
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="container">
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <h1>AI-Powered Screening &amp; Career Skill Gap Analyzer</h1>
        <p>
          Find the gap between your resume and your dream job — or screen many
          candidates fairly and transparently, always with evidence.
        </p>
        <div className="hero-actions">
          <Link to="/student" className="btn-light">
            I'm a Student <span className="msym" style={{ fontSize: 17 }}>arrow_forward</span>
          </Link>
          <Link to="/recruiter" className="btn-glass">
            I'm a Recruiter <span className="msym" style={{ fontSize: 17 }}>arrow_forward</span>
          </Link>
        </div>
        <div className="hero-metrics">
          <span><span className="msym" style={{ fontSize: 15 }}>lock</span> 100% Private local extraction</span>
          <span><span className="msym" style={{ fontSize: 15 }}>fact_check</span> Explicit evidence strings</span>
          <span><span className="msym" style={{ fontSize: 15 }}>gavel</span> Never auto-disqualifies</span>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section style={{ marginTop: 36 }}>
        <span className="home-kicker">Process</span>
        <h2 className="home-heading" style={{ marginBottom: 4 }}>How it works</h2>
        <div className="steps">
          <div className="step"><span className="step-no">1</span><b>Upload</b>Resume PDFs are read with PyMuPDF — text is extracted locally on the server.</div>
          <div className="step"><span className="step-no">2</span><b>Extract skills</b>A customizable dictionary of 128 skills finds skills as whole words, with evidence.</div>
          <div className="step"><span className="step-no">3</span><b>Compare</b>Matched vs missing skills are compared and scored transparently — formulas always shown.</div>
          <div className="step"><span className="step-no">4</span><b>Explain &amp; improve</b>Suggestions, a learning roadmap, and AI-estimated semantic matches marked for human review.</div>
        </div>
      </section>
    </div>
  )
}
