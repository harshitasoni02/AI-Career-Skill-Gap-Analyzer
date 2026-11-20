// RecruiterDashboard.jsx — Module 2 input page in the Stitch form style:
// job fields + multi-file dropzone with staged-file count. Logic unchanged.
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

  const words = jd.trim() ? jd.trim().split(/\s+/).length : 0

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
    <div>
      <div className="page-head">
        <div>
          <span className="home-kicker">Recruiter Portal</span>
          <h1 className="page-title">🏢 Recruiter Screening Agent</h1>
          <p className="subtitle">
            One job description, many resumes — ranked with evidence, for human review.
          </p>
        </div>
      </div>

      <div className="section" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          {/* Job title */}
          <div className="field-head">
            <label htmlFor="jobTitle">Job title</label>
            <span className="hint-tag">Optional</span>
          </div>
          <input id="jobTitle" type="text"
                 placeholder="e.g. Python Full Stack Developer Intern"
                 value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />

          {/* Job description */}
          <div className="field-head">
            <label htmlFor="jd">Job description — paste it here</label>
            <span className="req-tag">Required</span>
          </div>
          <div style={{ position: 'relative' }}>
            <textarea id="jd"
                      placeholder="Paste the full job description with required skills here..."
                      value={jd} onChange={(e) => setJd(e.target.value)} />
            <span className="note" style={{ position: 'absolute', bottom: 10, right: 14 }}>
              {words} words
            </span>
          </div>

          {/* Multi-file upload */}
          <div className="field-head">
            <label>Candidate resumes (PDF)</label>
            <span className="hint-tag">Up to 20 PDFs at once</span>
          </div>
          <label className="dropzone" style={{ marginBottom: 4 }}>
            <input id="files" type="file" accept=".pdf" multiple
                   onChange={(e) => setFiles([...e.target.files])} />
            <span className="dz-icon"><span className="msym">upload_file</span></span>
            <p style={{ margin: 0, fontSize: 14.5 }}>
              <b>Click to browse</b> or drop multiple candidate resumes (PDF)
            </p>
            <p className="note" style={{ margin: '5px 0 0' }}>
              Standard text or exported PDF formats recommended
            </p>
          </label>
          {files.length > 0 && (
            <span className="file-count">
              <span className="msym" style={{ fontSize: 17 }}>folder</span>
              {files.length} file{files.length > 1 ? 's' : ''} ready · {files.map((f) => f.name).join(', ')}
            </span>
          )}

          {error && <div className="error-box"><span className="msym" style={{ fontSize: 18 }}>error</span> {error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? 'Screening…' : <>📋 Screen candidates <span className="msym" style={{ fontSize: 17 }}>arrow_forward</span></>}
          </button>
        </form>
      </div>
    </div>
  )
}
