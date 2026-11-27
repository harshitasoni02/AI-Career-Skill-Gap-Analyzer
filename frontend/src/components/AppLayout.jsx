// AppLayout.jsx — the inner-page shell from the Stitch designs:
// a left Sidebar (fixed on desktop, slide-in drawer on mobile) plus the
// main content area. The global Ziva chat button lives in App.jsx.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function AppLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="app-shell">
      {/* Mobile top bar with the menu toggle */}
      <div className="sb-mobilebar">
        <button aria-label="Open menu" onClick={() => setNavOpen(true)}>
          <span className="msym">menu</span>
        </button>
        <Link to="/" className="sb-logo">
          <span className="sb-logo-badge"><span className="msym" style={{ fontSize: 17 }}>insights</span></span>
          Skill Gap Analyzer
        </Link>
      </div>

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && (
        <div className="sb-backdrop show" onClick={() => setNavOpen(false)} />
      )}

      <div className="app-main">
        <div className="app-content">{children}</div>
        <footer className="footer">
          AI-Powered Screening &amp; Career Skill Gap Analyzer <b>v2.1 (Stitch UI)</b> —
          scores and rankings support human review and never make automatic hiring
          decisions. No employment outcome is guaranteed.
        </footer>
      </div>
    </div>
  )
}
