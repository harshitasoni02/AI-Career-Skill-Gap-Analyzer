// DemoNotice.jsx — the honest answer for account-only routes in the public demo.
import { Link } from 'react-router-dom'

export default function DemoNotice() {
  return (
    <div className="page">
      <div className="empty-state demo-empty">
        <div className="page-kicker">Public demo</div>
        <h2>Accounts live in the full app.</h2>
        <p className="note">
          This deployment is a focused demo of the analysis engine and Ziva.
          Registration, profiles, saved reports, and history are disabled.
        </p>
        <div className="demo-empty-actions">
          <Link to="/student" className="btn">Analyze a résumé</Link>
          <Link to="/recruiter" className="btn btn-ghost">Screen candidates</Link>
        </div>
      </div>
    </div>
  )
}
