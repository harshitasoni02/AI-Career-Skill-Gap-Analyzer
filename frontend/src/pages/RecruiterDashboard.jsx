// RecruiterDashboard.jsx — Module 2 input page:
// paste ONE job description + upload MANY resumes → get ranked candidates.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUpload } from '../api.js'

export default function RecruiterDashboard() {
  const [jobTitle, setJobTitle] = useState('')
  const [jd, setJd] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!jd.trim()) { setError('Please paste the job description.'); return }
    if (files.length === 0) { setError('Please choose at least one resume PDF.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('job_title', jobTitle)
      fd.append('job_description', jd)
      // Each file goes under the SAME field name "files" —
      // that's how Flask's request.files.getlist("files") receives them.
      files.forEach((f) => fd.append('files', f))

      const data = await apiUpload('/api/screen-candidates', fd)
      sessionStorage.setItem('recruiterResult', JSON.stringify(data))
      navigate('/recruiter/results')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">🏢 Recruiter Screening Agent</h1>
      <p className="subtitle">
        One job description, many resumes — ranked with evidence, for human review.
      </p>

      <div className="section">
        <form onSubmit={handleSubmit}>
          <label htmlFor="jobTitle">Job title (optional)</label>
          <input
            id="jobTitle"
            type="text"
            placeholder="e.g. Python Full Stack Developer Intern"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />

          <label htmlFor="jd">Job description — paste it here</label>
          <textarea
            id="jd"
            placeholder="Paste the full job description with required skills here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          <label htmlFor="files">Candidate resumes (PDF, up to 20 at once)</label>
          <input
            id="files"
            type="file"
            accept=".pdf"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
          />
          {files.length > 0 && (
            <p className="note">{files.length} file(s) selected: {files.map((f) => f.name).join(', ')}</p>
          )}

          {error && <div className="error-box">⚠️ {error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Screening…' : '📋 Screen candidates'}
          </button>
        </form>
      </div>

      <div className="disclaimer">
        ⚖️ Rankings are based on extracted keywords and are meant to{' '}
        <b>support your judgment</b> — never to make automatic hiring or
        rejection decisions. Protected personal characteristics (gender,
        caste, religion, etc.) are never used. Verify every candidate in the
        original resumes.
      </div>
    </div>
  )
}
