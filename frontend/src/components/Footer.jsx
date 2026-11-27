// Footer.jsx — a quiet, single-line closing rail for a viewport-fitted app.
import { Link } from 'react-router-dom'
import { DEMO_MODE } from '../config.js'

export default function Footer() {
  return (
    <footer className="footer-bar">
      <div className="footer-inner">
        <span>© 2026 Skill Gap Analyzer</span>
        <nav aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/student">Student analysis</Link>
          <Link to="/recruiter">Candidate screening</Link>
          {!DEMO_MODE && <Link to="/history">Saved analyses</Link>}
        </nav>
        <span>{DEMO_MODE ? 'Public demo · reports are not saved.' : 'Built for human review.'}</span>
      </div>
    </footer>
  )
}
