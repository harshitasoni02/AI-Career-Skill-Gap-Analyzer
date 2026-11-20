// Login.jsx — clean centered login card (Stitch card style).
// Same submit logic: login → role dashboard.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
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
    <div className="container" style={{ maxWidth: 520, paddingTop: 48 }}>
      <div className="auth-card">
        <Link to="/" className="auth-brandlink">
          <span className="sb-logo-badge"><span className="msym">insights</span></span>
          Skill Gap Analyzer
        </Link>
        <h1>🔐 Log in</h1>
        <p className="subtitle">To save your analyses and use your role's dashboard.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <div className="input-icon">
            <span className="msym">mail</span>
            <input id="email" type="email" placeholder="you@example.com" value={email}
                   onChange={(e) => setEmail(e.target.value)} />
          </div>

          <label htmlFor="password">Password</label>
          <div className="input-icon">
            <span className="msym">lock</span>
            <input id="password" className="has-toggle" type={showPwd ? 'text' : 'password'}
                   placeholder="Enter your password"
                   value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="pwd-toggle" aria-label="Toggle password visibility"
                    onClick={() => setShowPwd(!showPwd)}>
              <span className="msym">{showPwd ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          {error && <div className="error-box"><span className="msym" style={{ fontSize: 18 }}>error</span> {error}</div>}

          <button className="btn" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Logging in…' : <>Log in <span className="msym" style={{ fontSize: 17 }}>arrow_forward</span></>}
          </button>
        </form>

        <div style={{ height: 1, background: 'var(--sc)', margin: '22px 0' }} />
        <p className="note" style={{ textAlign: 'center' }}>
          No account yet? <Link to="/register">Register here.</Link>
        </p>
      </div>
    </div>
  )
}
