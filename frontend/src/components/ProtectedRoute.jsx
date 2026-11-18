// ProtectedRoute.jsx — decides whether the CURRENT user may see a page.
//   role         → if logged in with the WRONG role, show a friendly
//                  "restricted" page instead of the tool (the backend
//                  still enforces 403 on the API itself — two locks!).
//   requireLogin → if nobody is logged in, ask them to log in first.
// Guests (no user) are allowed through role checks, matching the backend.
import { Link } from 'react-router-dom'
import { useUser } from './UserContext.jsx'

export default function ProtectedRoute({ role, requireLogin = false, children }) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="container"><div className="loading">Loading…</div></div>
  }

  if (requireLogin && !user) {
    return (
      <div className="container">
        <div className="section">
          <h2>🔒 Login required</h2>
          <p className="note">
            Please <Link to="/login">log in</Link> (or <Link to="/register">register</Link>)
            to view this page.
          </p>
        </div>
      </div>
    )
  }

  if (role && user && user.role !== role) {
    return (
      <div className="container">
        <div className="section">
          <h2>🔒 This area is for {role}s</h2>
          <p className="note">
            You are logged in as a <b>{user.role}</b>, and this tool belongs to the{' '}
            <b>{role}</b> role. (Behind the scenes the server also refuses the
            request with error <b>403 Forbidden</b> — shown here politely
            instead of a scary error page.)
          </p>
          <p className="note">
            Back to <Link to="/">home</Link> — or log out and use a {role} account.
          </p>
        </div>
      </div>
    )
  }

  return children
}
