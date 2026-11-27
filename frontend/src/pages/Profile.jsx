// Profile.jsx — the logged-in user's own account details.
// Students and recruiters see different fields.
import { Link } from 'react-router-dom'
import { useUser } from '../components/UserContext.jsx'
import Icon from '../components/Icons.jsx'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Profile() {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="page"><div className="loading">Loading…</div></div>
  }
  if (!user) return null // ProtectedRoute already shows "login required"

  const isStudent = user.role === 'student'
  const skills = (user.profile_skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="page profile-page">
      <header className="page-head">
        <div className="page-kicker">Account</div>
        <h1 className="page-title">Your profile</h1>
        <p className="subtitle">The details tied to your account — visible only to you.</p>
      </header>

      <div className="panel">
        <div className="profile-hero">
          <div className="avatar-large">
            {user.avatar ? <img src={user.avatar} alt="Profile" /> : initials(user.name)}
          </div>
          <div>
            <h2>{user.name}</h2>
            <p className="note">
              {user.email} · <span className="badge extracted">{user.role}</span>
            </p>
            {user.created_at && (
              <p className="note">Member since {user.created_at.slice(0, 10)}</p>
            )}
          </div>
          <Link to="/profile/edit" className="btn btn-small" style={{ marginLeft: 'auto' }}>
            <Icon name="pencil" size={14} /> Edit Profile
          </Link>
        </div>

        <div className="profile-grid">
          {isStudent && (
            <>
              <div className="profile-item">
                <div className="k">College / University</div>
                {user.college || '—'}
              </div>
              <div className="profile-item">
                <div className="k">Degree &amp; Branch</div>
                {user.degree_branch || '—'}
              </div>
              <div className="profile-item">
                <div className="k">Graduation Year</div>
                {user.graduation_year || '—'}
              </div>
              <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                <div className="k">My Skills</div>
                {skills.length > 0 ? (
                  skills.map((s, i) => (
                    <span key={i} className="chip gray" style={{ marginTop: 4 }}>{s}</span>
                  ))
                ) : (
                  '—'
                )}
              </div>
            </>
          )}
          {!isStudent && (
            <>
              <div className="profile-item">
                <div className="k">Company</div>
                {user.company || '—'}
              </div>
              <div className="profile-item">
                <div className="k">Job Title / Designation</div>
                {user.designation || '—'}
              </div>
            </>
          )}
          <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
            <div className="k">Short Bio</div>
            {user.bio || '—'}
          </div>
        </div>

        <p className="note" style={{ marginTop: 20 }}>
          This page always shows only the currently logged-in account — there is no
          way to view anyone else’s profile.
        </p>
      </div>
    </div>
  )
}
