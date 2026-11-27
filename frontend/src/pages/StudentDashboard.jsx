// StudentDashboard.jsx — Module 1 input page:
// upload résumé + paste job description → run the analysis.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUpload } from '../api.js'
import Icon from '../components/Icons.jsx'
import { IsoSteps } from '../components/Scene3D.jsx'

function fileSize(file) {
  if (!file) return ''
  const kb = file.size / 1024
  return kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`
}

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
    if (!file) { setError('Please choose your résumé PDF.'); return }
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
    <div className="page">
      <header className="page-head">
        <div className="page-kicker">Student analysis</div>
        <h1 className="page-title">See what the role asks of you.</h1>
        <p className="subtitle">
          Upload one résumé and one job description. The report separates what you
          can prove from what you still need to build — and shows the evidence.
        </p>
      </header>

      <div className="workbench">
        <div className="panel">
          <form onSubmit={handleSubmit}>
            <label htmlFor="resume">Your résumé (PDF only)</label>
            <input
              id="resume"
              className="file-input"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            <label className="file-drop" htmlFor="resume">
              <span className="file-drop-icon"><Icon name="file" size={19} /></span>
              <span className="file-drop-copy">
                <b>{file ? file.name : 'Choose a résumé PDF'}</b>
                <small>
                  {file ? `${fileSize(file)} · ready to analyze` : 'PDF only · up to 20 MB'}
                </small>
              </span>
              <span className="file-drop-action">{file ? 'Change' : 'Browse'}</span>
            </label>

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
              placeholder={'Paste the full job description here.\n\nExample: We are hiring an intern with Python, React, MySQL and Git. You will build REST APIs and work with relational databases.'}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />

            {error && <div className="error-box">{error}</div>}

            <button className="btn" disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze my skill gap'}
            </button>

            <div className="disclaimer">
              <Icon name="shield" size={15} />
              Your résumé stays on the server running this app. Scores are a guide
              for your own planning — not a promise of any job outcome.
            </div>
          </form>
        </div>

        <aside className="brief">
          <IsoSteps />
          <h2>What you’ll receive</h2>
          <p>A report you can read in five minutes and act on for months.</p>
          <ul className="brief-list">
            <li><b>A weighted score</b>The formula, the weights, and a simple coverage figure.</li>
            <li><b>Evidence for every match</b>The exact résumé line where the skill was found.</li>
            <li><b>A named gap</b>Missing skills, ordered by what the role needs most.</li>
            <li><b>A next-step roadmap</b>What to learn first, with resource hints and reasoning.</li>
          </ul>
          <div className="brief-note">
            <Icon name="shield" size={15} />
            <span>
              Your résumé text is not sent to the AI model. Ziva only receives your
              name, target role, score, and skill lists.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
