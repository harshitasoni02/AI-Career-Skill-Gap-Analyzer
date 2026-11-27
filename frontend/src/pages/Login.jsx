// Login.jsx — log in and return to the role's workspace.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api.js'
import AuthAside from '../components/AuthAside.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiJson('/api/login', { email, password })
      const role = data.user && data.user.role
      navigate(role === 'recruiter' ? '/recruiter' : '/student')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <AuthAside variant="login" />

      <div className="auth-main">
        <div className="auth-card">
          <header className="auth-head">
            <div className="page-kicker">Members</div>
            <h1>Log in</h1>
            <p>Access your saved reports and role-specific workspace.</p>
          </header>

          <div className="section">
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <div className="error-box">{error}</div>}

              <button className="btn btn-block" disabled={loading}>
                {loading ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            <p className="auth-foot">
              No account yet? <Link to="/register">Create one</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
