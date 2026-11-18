// Register.jsx — create an account (student OR recruiter).
// The password is sent once over the local connection and immediately
// hashed by the backend (never stored raw).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api.js'

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
    <div className="container" style={{ maxWidth: 560 }}>
      <h1 className="page-title">📝 Create an account</h1>
      <p className="subtitle">Your password is stored as a secure hash — never as plain text.</p>
      <div className="section">
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={name}
                 onChange={(e) => setName(e.target.value)} />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="password">Password (min 8 characters)</label>
          <input id="password" type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)} />

          <label>I am registering as</label>
          <div className="role-picker">
            <button type="button"
                    className={'role-opt' + (role === 'student' ? ' selected' : '')}
                    onClick={() => setRole('student')}>
              <span className="role-emoji">🎓</span>
              <b>Student</b>
              <span>Analyze my resume, find skill gaps, get a roadmap</span>
            </button>
            <button type="button"
                    className={'role-opt' + (role === 'recruiter' ? ' selected' : '')}
                    onClick={() => setRole('recruiter')}>
              <span className="role-emoji">🏢</span>
              <b>Recruiter</b>
              <span>Screen many candidate resumes against one job</span>
            </button>
          </div>
          <p className="note" style={{ marginTop: 8 }}>
            Your role decides which dashboard and tools you see after logging in.
          </p>

          {error && <div className="error-box">⚠️ {error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="note" style={{ marginTop: 14 }}>
          Already registered? <Link to="/login">Log in here</Link>.
        </p>
      </div>
    </div>
  )
}
