// Header.jsx — top navigation bar with a PROFILE DROPDOWN (Phase 4).
// Clicking the avatar (initials or picture) opens:
//   My Profile · Edit Profile · Account Settings · Logout
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { apiJson } from '../api.js'
import { useUser } from './UserContext.jsx'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Header() {
  const { user, setUser } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the dropdown whenever the page changes.
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Close the dropdown when clicking anywhere outside it.
  useEffect(() => {
    function onDocClick(e) {
      if (!e.target.closest('.profile-menu-wrap')) setMenuOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  async function logout() {
    try {
      await apiJson('/api/logout', {})
    } catch {
      /* even if this fails, we still clear the UI below */
    }
    setUser(null)
    window.location.href = '/' // simple full refresh
  }

  // Who can see which tool links? (role-aware navigation)
  const canSeeStudent = !user || user.role === 'student'
  const canSeeRecruiter = !user || user.role === 'recruiter'

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          🎯 <span>Skill Gap Analyzer</span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          {canSeeStudent && <NavLink to="/student">Student</NavLink>}
          {canSeeRecruiter && <NavLink to="/recruiter">Recruiter</NavLink>}
          <NavLink to="/history">History</NavLink>
          {user ? (
            <div className="profile-menu-wrap">
              <button
                className="avatar-btn"
                aria-label="Open profile menu"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {user.avatar ? <img src={user.avatar} alt="Profile" /> : <span>{initials(user.name)}</span>}
              </button>
              {menuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-head">
                    <span className="avatar-mini">
                      {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}
                    </span>
                    <div>
                      <b>{user.name}</b>
                      <div className="note">{user.email} · {user.role}</div>
                    </div>
                  </div>
                  <Link to="/profile">👤 My Profile</Link>
                  <Link to="/profile/edit">✏️ Edit Profile</Link>
                  <Link to="/settings">⚙️ Account Settings</Link>
                  <a
                    href="#logout"
                    onClick={(e) => {
                      e.preventDefault()
                      logout()
                    }}
                  >
                    🚪 Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
