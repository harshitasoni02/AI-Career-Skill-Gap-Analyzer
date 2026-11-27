// AccountSettings.jsx — change the current password securely.
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
      setMsg(d.message)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="page profile-page">
      <header className="page-head">
        <div className="page-kicker">Account</div>
        <h1 className="page-title">Account settings</h1>
        <p className="subtitle">Manage the credentials tied to your account.</p>
      </header>

      <div className="panel">
        <div className="profile-grid" style={{ marginTop: 0 }}>
          <div className="profile-item">
            <div className="k">Email (cannot be changed)</div>
            {user.email}
          </div>
          <div className="profile-item">
            <div className="k">Role</div>
            {user.role}
          </div>
        </div>

        <h2 style={{ fontSize: 24, margin: '28px 0 4px' }}>Change password</h2>
        <p className="note">Use at least eight characters. Your current password is required.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="curPass">Current password</label>
          <input id="curPass" type="password" autoComplete="current-password"
                 value={current} onChange={(e) => setCurrent(e.target.value)} />

          <label htmlFor="newPass">New password (min 8 characters)</label>
          <input id="newPass" type="password" autoComplete="new-password"
                 value={next} onChange={(e) => setNext(e.target.value)} />

          <label htmlFor="confPass">Confirm new password</label>
          <input id="confPass" type="password" autoComplete="new-password"
                 value={confirm} onChange={(e) => setConfirm(e.target.value)} />

          {error && <div className="error-box">{error}</div>}
          {msg && <div className="disclaimer success">{msg}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="note" style={{ marginTop: 18 }}>
          <Link to="/profile">Back to My Profile</Link>
        </p>
      </div>
    </div>
  )
}
