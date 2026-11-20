// Register.jsx — clean centered registration card (Stitch card style)
// with the role picker. Password is hashed by the backend.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api.js'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
      navigate(data.user.role === 'recruiter' ? '/recruiter' : '/student')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 560, paddingTop: 48 }}>
      <div className="auth-card">
        <Link to="/" className="auth-brandlink">
          <span className="sb-logo-badge"><span className="msym">insights</span></span>
          Skill Gap Analyzer
        </Link>
        <h1>📝 Create an account</h1>
        <p className="subtitle">Choose your role — it decides your dashboard and tools.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <div className="input-icon">
            <span className="msym">person</span>
            <input id="name" type="text" placeholder="Your name" value={name}
                   onChange={(e) => setName(e.target.value)} />
          </div>

          <label htmlFor="email">Email</label>
          <div className="input-icon">
            <span className="msym">mail</span>
            <input id="email" type="email" placeholder="you@example.com" value={email}
                   onChange={(e) => setEmail(e.target.value)} />
          </div>

          <label htmlFor="password">Password (min 8 characters)</label>
          <div className="input-icon">
            <span className="msym">lock</span>
            <input id="password" className="has-toggle" type={showPwd ? 'text' : 'password'}
                   placeholder="Create a strong password"
                   value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="pwd-toggle" aria-label="Toggle password visibility"
                    onClick={() => setShowPwd(!showPwd)}>
              <span className="msym">{showPwd ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

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

          {error && <div className="error-box">⚠️ {error}</div>}

          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating…' : <>Create account <span className="msym" style={{ fontSize: 17 }}>arrow_forward</span></>}
          </button>
        </form>

        <div style={{ height: 1, background: 'var(--sc)', margin: '22px 0' }} />
        <p className="note" style={{ textAlign: 'center' }}>
          Already registered? <Link to="/login">Log in here.</Link>
        </p>
      </div>
    </div>
  )
}
