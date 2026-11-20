// Sidebar.jsx — the left navigation shown on inner pages (Stitch design).
// Role-aware: students don't see the recruiter tool and vice versa; guests
// see both tools. Uses Material Symbols icons like the reference screens.
import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { apiJson } from '../api.js'
import { useUser } from './UserContext.jsx'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar({ open, onClose }) {
  const { user, setUser } = useUser()
  const location = useLocation()

  // Close the mobile drawer whenever the page changes.
  useEffect(() => { onClose() }, [location.pathname]) // eslint-disable-line

  async function logout() {
    try { await apiJson('/api/logout', {}) } catch { /* clear UI anyway */ }
    setUser(null)
    window.location.href = '/'
  }

  const canSeeStudent = !user || user.role === 'student'
  const canSeeRecruiter = !user || user.role === 'recruiter'

  return (
    <aside className={'sidebar' + (open ? ' open' : '')}>
      <Link to="/" className="sb-logo">
        <span className="sb-logo-badge"><span className="msym">insights</span></span>
        Skill Gap Analyzer
      </Link>

      <div className="sb-section">Workspace</div>
      <NavLink to="/" end className="sb-link">
        <span className="msym">home</span> Home
      </NavLink>
      {canSeeStudent && (
        <NavLink to="/student" className="sb-link">
          <span className="msym">school</span> Student Dashboard
        </NavLink>
      )}
      {canSeeRecruiter && (
        <NavLink to="/recruiter" className="sb-link">
          <span className="msym">business_center</span> Recruiter Dashboard
        </NavLink>
      )}
      <NavLink to="/history" className="sb-link">
        <span className="msym">history</span> History
      </NavLink>

      {user && (
        <>
          <div className="sb-section">Account</div>
          <NavLink to="/profile" className="sb-link">
            <span className="msym">person</span> My Profile
          </NavLink>
          <NavLink to="/profile/edit" className="sb-link">
            <span className="msym">edit</span> Edit Profile
          </NavLink>
          <NavLink to="/settings" className="sb-link">
            <span className="msym">settings</span> Settings
          </NavLink>
        </>
      )}

      <div className="sb-spacer" />

      {user ? (
        <div>
          <div className="sb-user">
            <span className="sb-avatar">
              {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}
            </span>
            <div>
              <b>{user.name}</b>
              <span className="note">{user.role}</span>
            </div>
          </div>
          <button className="sb-logout" onClick={logout}>
            <span className="msym">logout</span> Log out
          </button>
        </div>
      ) : (
        <div style={{ padding: '12px 12px 0', display: 'flex', gap: 8 }}>
          <Link to="/login" className="btn btn-small" style={{ marginTop: 0 }}>Log in</Link>
          <Link to="/register" className="btn btn-small" style={{ marginTop: 0, background: 'var(--sc)', color: 'var(--primary)' }}>Register</Link>
        </div>
      )}

      <div className="sb-powered">
        <span className="msym" style={{ fontSize: 15 }}>auto_awesome</span>
        Powered by Ziva AI
      </div>
    </aside>
  )
}
