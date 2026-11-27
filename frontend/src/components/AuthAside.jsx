// AuthAside.jsx — the editorial panel beside the login / register forms,
// anchored by a small orbiting 3D mark.
import Icon from './Icons.jsx'
import { OrbScene } from './Scene3D.jsx'

const COPY = {
  login: {
    kicker: 'Career intelligence',
    title: 'Pick up where you left off.',
    body: 'Your saved reports, profile, and career conversations are waiting.',
    points: [
      'Every score shows its formula',
      'Evidence behind every match',
      'AI estimates stay labelled',
    ],
  },
  register: {
    kicker: 'One account, two desks',
    title: 'A clearer view of what you know.',
    body: 'Create one account for analysis, saved reports, and career guidance, as a student or a hiring team.',
    points: [
      'Résumé analysis with evidence',
      'Role-aware dashboards',
      'Saved history you can revisit',
    ],
  },
}

export default function AuthAside({ variant = 'login' }) {
  const copy = COPY[variant] || COPY.login

  return (
    <aside className="auth-aside">
      <OrbScene />
      <div className="auth-aside-content">
        <div className="aside-kicker">{copy.kicker}</div>
        <h2>{copy.title}</h2>
        <p className="aside-copy">{copy.body}</p>
        <ul className="auth-points">
          {copy.points.map((p) => (
            <li key={p}>
              <Icon name="checkCircle" size={15} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
