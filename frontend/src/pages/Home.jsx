// Home.jsx — the landing page with the two module cards.
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
      <div className="hero">
        <h1>AI-Powered Screening &amp; Career Skill Gap Analyzer</h1>
        <p>
          Find the gap between your resume and your dream job — or screen many
          candidates fairly and transparently, always with evidence.
        </p>
        <Link to="/student" className="btn-light">🎓 I'm a Student</Link>
        <Link to="/recruiter" className="btn-light">🏢 I'm a Recruiter</Link>
      </div>

      <div className="container">
        <div className="cards">
          <Link to="/student" className="card clickable">
            <div className="icon">🎓</div>
            <h3>Student Career Assistant</h3>
            <p className="note">
              Upload your resume, paste a job description, and see exactly which
              skills match, which are missing, your match score, improvement
              tips, and a learning roadmap.
            </p>
          </Link>
          <Link to="/recruiter" className="card clickable">
            <div className="icon">🏢</div>
            <h3>Recruiter Screening Agent</h3>
            <p className="note">
              Paste one job description, upload many resumes, and get a ranked
              list of candidates with match scores, evidence, and explanations
              to support — never replace — your judgment.
            </p>
          </Link>
        </div>

        <h2 className="page-title" style={{ marginTop: 40 }}>How it works</h2>
        <div className="steps">
          <div className="step"><b>1. Upload</b>Resume PDFs are read with PyMuPDF — text is extracted locally on the server.</div>
          <div className="step"><b>2. Extract skills</b>A customizable dictionary of 100+ skills finds skills as whole words, with evidence.</div>
          <div className="step"><b>3. Compare</b>Matched vs missing skills are compared and scored transparently (matched ÷ required).</div>
          <div className="step"><b>4. Explain &amp; improve</b>You get suggestions, a learning roadmap, and AI-estimated semantic matches marked for human review.</div>
        </div>

        <div className="disclaimer">
          ⚖️ <b>Honesty first:</b> keyword and semantic matching can miss context and is
          not proof of ability. Every score is meant to <b>support human review</b> —
          never to make automatic hiring or rejection decisions. This tool does not
          guarantee employment.
        </div>
      </div>
    </>
  )
}
