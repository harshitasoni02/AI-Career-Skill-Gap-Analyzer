// AccountSettings.jsx — change MY password securely.
// The backend requires the CURRENT password before accepting a new one.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api.js'
import { useUser } from '../components/UserContext.jsx'

export default function AccountSettings() {
  const { user } = useUser()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    if (next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (next !== confirm) {
      setError('New password and confirmation do not match.')
      return
    }
    setLoading(true)
    try {
      const d = await apiJson('/api/account/password', {
        current_password: current,
        new_password: next,
      })
      setMsg('✅ ' + d.message)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1 className="page-title">⚙️ Account Settings</h1>
      <p className="subtitle">Manage your account security.</p>

      <div className="section">
        <div className="profile-item" style={{ marginBottom: 14 }}>
          <div className="k">Email (cannot be changed)</div>
          {user.email}
        </div>
        <div className="profile-item" style={{ marginBottom: 14 }}>
          <div className="k">Role</div>
          {user.role}
        </div>

        <h2 style={{ fontSize: 16 }}>🔑 Change password</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="curPass">Current password</label>
          <input id="curPass" type="password" value={current}
                 onChange={(e) => setCurrent(e.target.value)} />

          <label htmlFor="newPass">New password (min 8 characters)</label>
          <input id="newPass" type="password" value={next}
                 onChange={(e) => setNext(e.target.value)} />

          <label htmlFor="confPass">Confirm new password</label>
          <input id="confPass" type="password" value={confirm}
                 onChange={(e) => setConfirm(e.target.value)} />

          {error && <div className="error-box">⚠️ {error}</div>}
          {msg && <div className="disclaimer">{msg}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Updating…' : '🔐 Update password'}
          </button>
        </form>
        <p className="note" style={{ marginTop: 14 }}>
          <Link to="/profile">← Back to My Profile</Link>
        </p>
      </div>
    </div>
  )
}
