// ProtectedRoute.jsx — decides whether the current user may see a page.
//   role         → wrong role sees a friendly "restricted" page
//                  (the backend also enforces 403 on the API itself).
//   requireLogin → nobody logged in → ask them to log in first.
// Guests are allowed through role checks, matching the backend.
import { Link } from 'react-router-dom'
import { useUser } from './UserContext.jsx'

export default function ProtectedRoute({ role, requireLogin = false, children }) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="page"><div className="loading">Loading…</div></div>
  }

  if (requireLogin && !user) {
    return (
      <div className="page">
        <div className="section empty-state">
          <h2>Login required</h2>
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
      <div className="page">
        <div className="section empty-state">
          <h2>This area is for {role}s</h2>
          <p className="note">
            You are logged in as a <b>{user.role}</b>, and this tool belongs to the{' '}
            <b>{role}</b> role. The server also refuses the request with{' '}
            <b>403 Forbidden</b> — shown here politely instead of a scary error page.
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
