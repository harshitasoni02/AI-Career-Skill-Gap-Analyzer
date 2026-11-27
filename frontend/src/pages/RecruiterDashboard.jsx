// RecruiterDashboard.jsx — Module 2 input page:
// paste ONE job description + upload MANY résumés → get ranked candidates.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUpload } from '../api.js'
import Icon from '../components/Icons.jsx'
import { IsoSteps } from '../components/Scene3D.jsx'

function fileSize(file) {
  const kb = file.size / 1024
  return kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`
}

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
    if (files.length === 0) { setError('Please choose at least one résumé PDF.'); return }

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
    <div className="page">
      <header className="page-head">
        <div className="page-kicker">Recruiter screening</div>
        <h1 className="page-title">Shortlist with evidence, not guesswork.</h1>
        <p className="subtitle">
          One job description, many résumés. Every candidate gets a transparent
          score, the evidence behind each match, and a place in a reviewable ranking.
        </p>
      </header>

      <div className="workbench">
        <div className="panel">
          <form onSubmit={handleSubmit}>
            <label htmlFor="jobTitle">Job title <span className="note">(optional)</span></label>
            <input
              id="jobTitle"
              type="text"
              placeholder="e.g. Full Stack Developer Intern"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />

            <label htmlFor="jd">Job description</label>
            <textarea
              id="jd"
              placeholder="Paste the full job description with the required skills here…"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />

            <label htmlFor="files">
              Candidate résumés <span className="note">(PDF, up to 20 at once)</span>
            </label>
            <input
              id="files"
              className="file-input"
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
            />
            <label className="file-drop" htmlFor="files">
              <span className="file-drop-icon"><Icon name="file" size={19} /></span>
              <span className="file-drop-copy">
                <b>
                  {files.length > 0
                    ? `${files.length} résumé${files.length === 1 ? '' : 's'} selected`
                    : 'Choose candidate PDFs'}
                </b>
                <small>{files.length > 0 ? 'Ready to screen' : 'Select one or more PDF files'}</small>
              </span>
              <span className="file-drop-action">{files.length > 0 ? 'Change' : 'Browse'}</span>
            </label>

            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f) => (
                  <li key={f.name + f.size}>
                    <span>{f.name}</span>
                    <span>{fileSize(f)}</span>
                  </li>
                ))}
              </ul>
            )}

            {error && <div className="error-box">{error}</div>}

            <button className="btn" disabled={loading}>
              {loading ? 'Screening…' : 'Screen candidates'}
            </button>

            <div className="disclaimer">
              Rankings use extracted keywords and are meant to support your
              judgment — never to make automatic hiring or rejection decisions.
              Protected personal characteristics are never used. Verify every
              candidate in the original résumé.
            </div>
          </form>
        </div>

        <aside className="brief">
          <IsoSteps />
          <h2>What the report gives you</h2>
          <p>A shortlist you can defend, with the working shown.</p>
          <ul className="brief-list">
            <li><b>A ranked shortlist</b>Weighted and simple scores side by side for every candidate.</li>
            <li><b>Evidence for every match</b>The exact résumé line behind each skill.</li>
            <li><b>Named gaps</b>What each candidate is missing for this role, not just a number.</li>
            <li><b>A saved record</b>Keep the screening in your history for later comparison.</li>
          </ul>
          <div className="brief-note">
            <Icon name="scale" size={15} />
            <span>
              Scores are decision support. Read the original résumés before
              advancing or rejecting anyone.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
