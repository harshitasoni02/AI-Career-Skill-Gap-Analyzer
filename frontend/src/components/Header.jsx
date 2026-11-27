// Header.jsx — editorial masthead + role-aware navigation + profile menu.
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { apiJson } from '../api.js'
import { DEMO_MODE } from '../config.js'
import { useUser } from './UserContext.jsx'
import Icon from './Icons.jsx'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Header() {
  const { user, setUser } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  // Close the menus whenever the page changes.
  useEffect(() => {
    setMenuOpen(false)
    setNavOpen(false)
  }, [location.pathname])

  // Close the profile dropdown when clicking anywhere outside it.
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
        <Link to="/" className="logo" aria-label="Skill Gap Analyzer — home">
          <span className="logo-mark" aria-hidden="true">S</span>
          <span className="logo-text">Skill Gap Analyzer</span>
        </Link>

        <button
          className="menu-btn"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen(!navOpen)}
        >
          <Icon name={navOpen ? 'close' : 'menu'} size={19} />
        </button>

        <nav className={'nav' + (navOpen ? ' open' : '')}>
          <NavLink to="/" end onClick={() => setNavOpen(false)}>Home</NavLink>
          {canSeeStudent && <NavLink to="/student" onClick={() => setNavOpen(false)}>Student</NavLink>}
          {canSeeRecruiter && <NavLink to="/recruiter" onClick={() => setNavOpen(false)}>Recruiter</NavLink>}
          {!DEMO_MODE && (
            <NavLink to="/history" onClick={() => setNavOpen(false)}>History</NavLink>
          )}
          {DEMO_MODE ? (
            <span className="nav-demo" title="Accounts and saved reports are disabled in this deployment">
              Public demo
            </span>
          ) : user ? (
            <div className="profile-menu-wrap">
              <button
                className="avatar-btn"
                aria-label="Open profile menu"
                aria-expanded={menuOpen}
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
                  <Link to="/profile"><Icon name="user" size={16} /> My Profile</Link>
                  <Link to="/profile/edit"><Icon name="pencil" size={16} /> Edit Profile</Link>
                  <Link to="/settings"><Icon name="settings" size={16} /> Account Settings</Link>
                  <a
                    href="#logout"
                    onClick={(e) => {
                      e.preventDefault()
                      logout()
                    }}
                  >
                    <Icon name="logout" size={16} /> Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setNavOpen(false)}>Login</NavLink>
              <Link to="/register" className="nav-cta" onClick={() => setNavOpen(false)}>Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
