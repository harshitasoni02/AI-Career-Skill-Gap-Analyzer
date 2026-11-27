// Register.jsx — create an account (student OR recruiter).
// The password is sent once and immediately hashed by the backend.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api.js'
import AuthAside from '../components/AuthAside.jsx'
import Icon from '../components/Icons.jsx'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const data = await apiJson('/api/register', { name, email, password, role })
      // Role-based dashboards: each role lands on its own workspace.
      navigate(data.user.role === 'recruiter' ? '/recruiter' : '/student')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <AuthAside variant="register" />

      <div className="auth-main">
        <div className="auth-card wide">
          <header className="auth-head">
            <div className="page-kicker">New account</div>
            <h1>Create your account</h1>
            <p>Your password is stored as a secure hash — never as plain text.</p>
          </header>

          <div className="section">
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="password">Password (min 8 characters)</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <label>I am registering as</label>
              <div className="role-picker">
                <button
                  type="button"
                  className={'role-opt' + (role === 'student' ? ' selected' : '')}
                  onClick={() => setRole('student')}
                >
                  <span className="role-icon"><Icon name="graduation" size={18} /></span>
                  <b>Student</b>
                  <span>Analyze my résumé, find skill gaps, and get a learning roadmap.</span>
                </button>
                <button
                  type="button"
                  className={'role-opt' + (role === 'recruiter' ? ' selected' : '')}
                  onClick={() => setRole('recruiter')}
                >
                  <span className="role-icon"><Icon name="building" size={18} /></span>
                  <b>Recruiter</b>
                  <span>Screen many candidate résumés against one job description.</span>
                </button>
              </div>
              <p className="note" style={{ marginTop: 10 }}>
                Your role decides which workspace and tools you see after logging in.
              </p>

              {error && <div className="error-box">{error}</div>}

              <button className="btn btn-block" disabled={loading}>
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </form>

            <p className="auth-foot">
              Already registered? <Link to="/login">Log in here</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
