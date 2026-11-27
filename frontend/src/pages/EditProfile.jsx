// EditProfile.jsx — edit the current user's profile.
// Students see college/degree/year/skills; recruiters see company/designation.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api.js'
import { useUser } from '../components/UserContext.jsx'

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function EditProfile() {
  const { user, setUser } = useUser()

  // Pre-fill the form with what's already in the database.
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    bio: user.bio || '',
    college: user.college || '',
    degree_branch: user.degree_branch || '',
    graduation_year: user.graduation_year || '',
    profile_skills: user.profile_skills || '',
    company: user.company || '',
    designation: user.designation || '',
  }))
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null)
  const [removePic, setRemovePic] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isStudent = user.role === 'student'

  function set(field, value) {
    setForm({ ...form, [field]: value })
  }

  function onAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (png/jpg).')
      return
    }
    if (file.size > 200 * 1024) {
      setError('Image too large — please choose one under 200 KB.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result) // the image as a data URL
      setRemovePic(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    setLoading(true)
    const payload = { ...form }
    if (removePic) payload.avatar = null
    else if (avatarPreview) payload.avatar = avatarPreview
    try {
      const data = await apiJson('/api/profile', payload, 'PUT')
      setUser(data.profile) // refresh the app-wide user state instantly
      setMsg('Profile saved.')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="page profile-page">
      <header className="page-head">
        <div className="page-kicker">Account</div>
        <h1 className="page-title">Edit profile</h1>
        <p className="subtitle">Changes are saved to your account in the database.</p>
      </header>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <div className="avatar-edit-row">
            <div className="avatar-large">
              {removePic
                ? initials(user.name)
                : avatarPreview
                  ? <img src={avatarPreview} alt="" />
                  : initials(user.name)}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ marginTop: 0 }}>Profile picture (optional, under 200 KB)</label>
              <input type="file" accept="image/*" onChange={onAvatarChange} />
              {(user.avatar || avatarPreview) && !removePic && (
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => { setRemovePic(true); setAvatarPreview(null) }}
                >
                  Remove picture
                </button>
              )}
            </div>
          </div>

          <label htmlFor="pName">Full name</label>
          <input id="pName" type="text" value={form.name}
                 onChange={(e) => set('name', e.target.value)} />

          {isStudent && (
            <>
              <label htmlFor="pCollege">College / University name</label>
              <input id="pCollege" type="text" value={form.college}
                     onChange={(e) => set('college', e.target.value)} />

              <label htmlFor="pDegree">Degree and Branch</label>
              <input id="pDegree" type="text" placeholder="e.g. B.Tech Computer Science and AI"
                     value={form.degree_branch}
                     onChange={(e) => set('degree_branch', e.target.value)} />

              <label htmlFor="pYear">Graduation year</label>
              <input id="pYear" type="number" min="2000" max="2100" placeholder="e.g. 2026"
                     value={form.graduation_year}
                     onChange={(e) => set('graduation_year', e.target.value)} />

              <label htmlFor="pSkills">Skills (comma-separated)</label>
              <input id="pSkills" type="text" placeholder="e.g. Python, SQL, React, Communication"
                     value={form.profile_skills}
                     onChange={(e) => set('profile_skills', e.target.value)} />
            </>
          )}

          {!isStudent && (
            <>
              <label htmlFor="pCompany">Company name</label>
              <input id="pCompany" type="text" value={form.company}
                     onChange={(e) => set('company', e.target.value)} />

              <label htmlFor="pDesig">Job title / designation</label>
              <input id="pDesig" type="text" placeholder="e.g. HR Recruiter"
                     value={form.designation}
                     onChange={(e) => set('designation', e.target.value)} />
            </>
          )}

          <label htmlFor="pBio">Short bio</label>
          <textarea id="pBio" value={form.bio}
                    placeholder="A line or two about yourself…"
                    onChange={(e) => set('bio', e.target.value)} />

          {error && <div className="error-box">{error}</div>}
          {msg && <div className="disclaimer success">{msg}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
        <p className="note" style={{ marginTop: 18 }}>
          <Link to="/profile">Back to My Profile</Link>
        </p>
      </div>
    </div>
  )
}
