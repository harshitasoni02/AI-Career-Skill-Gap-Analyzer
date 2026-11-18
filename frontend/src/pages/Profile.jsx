// Profile.jsx — "My Profile" page. Shows the logged-in user's OWN data
// from the database. Students and recruiters see different fields.
import { Link } from 'react-router-dom'
import { useUser } from '../components/UserContext.jsx'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Profile() {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="container"><div className="loading">Loading…</div></div>
  }
  if (!user) return null // ProtectedRoute already shows "login required"

  const isStudent = user.role === 'student'
  const skills = (user.profile_skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 className="page-title">👤 My Profile</h1>
      <p className="subtitle">This information comes from YOUR account in the database.</p>

      <div className="section">
        <div className="profile-hero">
          <div className="avatar-large">
            {user.avatar ? <img src={user.avatar} alt="Profile" /> : initials(user.name)}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <p className="note" style={{ margin: '4px 0 0' }}>
              {user.email} · <span className="badge extracted">{user.role.toUpperCase()}</span>
            </p>
            {user.created_at && (
              <p className="note" style={{ margin: '2px 0 0' }}>
                Member since {user.created_at.slice(0, 10)}
              </p>
            )}
          </div>
          <Link to="/profile/edit" className="btn btn-small" style={{ marginLeft: 'auto' }}>
            ✏️ Edit Profile
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
                    <span key={i} className="chip gray" style={{ margin: '2px 4px 2px 0' }}>{s}</span>
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

        <p className="note" style={{ marginTop: 12 }}>
          🔒 This page always shows only the currently logged-in account —
          there is no way to view anyone else's profile.
        </p>
      </div>
    </div>
  )
}
