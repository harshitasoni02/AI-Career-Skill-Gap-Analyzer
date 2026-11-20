// StudentDashboard.jsx — Module 1 input page in the Stitch form style:
// labeled fields with "Required" tags, a textarea with word count, and a
// dashed upload dropzone. All logic unchanged (upload → analyze).
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

  const words = jd.trim() ? jd.trim().split(/\s+/).length : 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!file) { setError('Please choose your resume PDF.'); return }
    if (!jd.trim()) { setError('Please paste the job description.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('job_title', jobTitle)
      fd.append('job_description', jd)
      const data = await apiUpload('/api/analyze-resume', fd)
      sessionStorage.setItem('studentResult', JSON.stringify(data))
      navigate('/student/results')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="home-kicker">Student Portal</span>
          <h1 className="page-title">🎓 Student Career Assistant</h1>
          <p className="subtitle">
            Upload your resume and paste a job description — we'll find your skill gap.
          </p>
        </div>
      </div>

      <div className="section" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          {/* Field 1 — resume upload (dropzone) */}
          <div className="field-head">
            <label style={{ marginTop: 4 }}>Your resume (PDF only)</label>
            <span className="req-tag">Required</span>
          </div>
          <label className="dropzone" style={{ marginBottom: 4 }}>
            <input id="resume" type="file" accept=".pdf"
                   onChange={(e) => setFile(e.target.files[0] || null)} />
            <span className="dz-icon"><span className="msym">upload_file</span></span>
            <p style={{ margin: 0, fontSize: 14.5 }}>
              <b>Click to browse</b> or drop your resume PDF here
            </p>
            <p className="note" style={{ margin: '5px 0 0' }}>
              Standard text or exported PDF formats recommended
            </p>
          </label>
          {file && (
            <span className="file-count">
              <span className="msym" style={{ fontSize: 17 }}>description</span>
              {file.name} ready
            </span>
          )}

          {/* Field 2 — job title */}
          <div className="field-head">
            <label htmlFor="jobTitle">Job title</label>
            <span className="hint-tag">Optional</span>
          </div>
          <input id="jobTitle" type="text"
                 placeholder="e.g. Python Full Stack Developer Intern"
                 value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />

          {/* Field 3 — job description */}
          <div className="field-head">
            <label htmlFor="jd">Job description — paste it here</label>
            <span className="req-tag">Required</span>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea id="jd"
                      placeholder={'Paste the full job description here...\n\nExample: We are hiring an intern with Python, JavaScript, React, MySQL and Git skills...'}
                      value={jd} onChange={(e) => setJd(e.target.value)} />
            <span className="note" style={{ position: 'absolute', bottom: 10, right: 14 }}>
              {words} words
            </span>
          </div>

          {error && <div className="error-box"><span className="msym" style={{ fontSize: 18 }}>error</span> {error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Analyzing…' : <>🔍 Analyze my skill gap <span className="msym" style={{ fontSize: 17 }}>arrow_forward</span></>}
          </button>
        </form>
      </div>
    </div>
  )
}
