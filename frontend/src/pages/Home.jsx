// Home.jsx — a single-viewport editorial opening: the promise, the sample
// report as a tactile 3D object, and the three rules behind every result.
import { Link } from 'react-router-dom'
import Icon from '../components/Icons.jsx'
import { HeroScene } from '../components/Scene3D.jsx'
import { DEMO_MODE } from '../config.js'

export default function Home() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="hero-kicker">Career intelligence for both sides of hiring</div>
          <h1>Read your résumé the way a hiring team does.</h1>
          <p className="lede">
            See what you can prove, what the role still expects, and the shortest
            path to close the gap, with evidence behind every line.
          </p>
          <div className="hero-actions">
            <Link to="/student" className="btn btn-lg">Analyze a résumé</Link>
            <Link to="/recruiter" className="btn btn-ghost btn-lg">Screen candidates</Link>
          </div>
          <p className="hero-footnote">
            {DEMO_MODE
              ? 'Public demo: no account needed. PDFs are processed in memory and reports are not saved.'
              : 'No account needed for the first analysis. Human review stays in the loop.'}
          </p>
        </div>

        <div className="hero-visual">
          <HeroScene />
        </div>
      </section>

      <section className="principles-strip">
        <div className="principle">
          <Icon name="eye" size={18} />
          <div>
            <h3>Evidence, not adjectives</h3>
            <p>Every match shows the exact résumé line behind it.</p>
          </div>
        </div>
        <div className="principle">
          <Icon name="scale" size={18} />
          <div>
            <h3>A score you can audit</h3>
            <p>Weighted and simple coverage, with the formula in plain sight.</p>
          </div>
        </div>
        <div className="principle">
          <Icon name="user" size={18} />
          <div>
            <h3>Judgment stays human</h3>
            <p>AI estimates are labelled and kept out of the score.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
