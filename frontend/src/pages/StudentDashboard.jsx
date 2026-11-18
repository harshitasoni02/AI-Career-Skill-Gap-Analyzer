// StudentDashboard.jsx — Module 1 input page:
// upload resume + paste job description → run the analysis.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUpload } from '../api.js'

export default function StudentDashboard() {
  const [file, setFile] = useState(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault() // stop the browser from reloading the page
    setError('')

    // Client-side checks — faster feedback than waiting for the server.
    if (!file) { setError('Please choose your resume PDF.'); return }
    if (!jd.trim()) { setError('Please paste the job description.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('job_title', jobTitle)
      fd.append('job_description', jd)

      const data = await apiUpload('/api/analyze-resume', fd)
      // Hand the result to the results page via sessionStorage.
      sessionStorage.setItem('studentResult', JSON.stringify(data))
      navigate('/student/results')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">🎓 Student Career Assistant</h1>
      <p className="subtitle">
        Upload your resume and paste a job description — we'll find your skill gap.
      </p>

      <div className="section">
        <form onSubmit={handleSubmit}>
          <label htmlFor="resume">Your resume (PDF only)</label>
          <input
            id="resume"
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />

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
            placeholder={'Paste the full job description here...\n\nExample: We are hiring an intern with Python, JavaScript, React, MySQL and Git skills...'}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />

          {error && <div className="error-box">⚠️ {error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Analyzing…' : '🔍 Analyze my skill gap'}
          </button>
        </form>
      </div>

      <div className="disclaimer">
        🔒 Your resume stays on your own computer (it is stored only in the
        backend's <code>uploads</code> folder). Scores support human review —
        they are not a promise of any job outcome.
      </div>
    </div>
  )
}
