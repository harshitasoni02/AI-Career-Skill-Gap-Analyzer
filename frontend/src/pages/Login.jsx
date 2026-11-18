// Login.jsx — simple login form. After logging in, each role is sent
// to its own dashboard (student → /student, recruiter → /recruiter).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiJson } from '../api.js'

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
    <div className="container" style={{ maxWidth: 480 }}>
      <h1 className="page-title">🔐 Log in</h1>
      <p className="subtitle">To save your analyses and use your role's dashboard.</p>
      <div className="section">
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password}
                 onChange={(e) => setPassword(e.target.value)} />

          {error && <div className="error-box">⚠️ {error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="note" style={{ marginTop: 14 }}>
          No account yet? <Link to="/register">Register here</Link>.
        </p>
      </div>
    </div>
  )
}
