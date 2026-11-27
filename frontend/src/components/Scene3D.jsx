// Scene3D.jsx — the tactile, three-dimensional layer of the identity.
// Everything here is decorative and CSS/SVG driven: no WebGL, no dependencies.
// The signature object is a stack of report sheets floating above the desk.
import { useEffect, useState } from 'react'
import Icon from './Icons.jsx'

// Counts 0 → target once, on mount. The hero report is a sample, but letting
// the number arrive instead of appearing makes the product legible at a glance:
// this is what "analyzed" looks like. Reduced motion gets the final value
// immediately, so nothing is lost when animation is off.
function useCountUp(target, duration = 1150) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    let frame
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      // ease-out cubic: moves off quickly, then settles
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    // Safety net: rAF is suspended in background tabs and can be throttled by
    // battery settings. Without this the hero would sit on "0%" — a number
    // that reads as a broken result rather than a pending one.
    const settle = setTimeout(() => setValue(target), duration + 120)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(settle)
    }
  }, [target, duration])

  return value
}

// One pass of a scan line travelling down the sheet, like a reader's eye.
function ScanLine() {
  return <span className="sample-scan" aria-hidden="true" />
}

export function HeroScene() {
  const score = useCountUp(45)

  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-disc" />
      <div className="scene-ring scene-ring-a" />
      <div className="scene-ring scene-ring-b" />

      <div className="scene-stack">
        <div className="scene-sheet scene-sheet-back" />
        <div className="scene-sheet scene-sheet-mid" />

        <div className="scene-report">
          <ScanLine />
          <div className="sample-head">
            <span className="sample-label">Sample report</span>
            <span className="sample-role">Full Stack Developer Intern</span>
          </div>

          <div className="sample-score-row">
            <span className="sample-score">{score}%</span>
            <span className="sample-score-meta">
              <b>Weighted match</b>
              simple coverage 37.5%
            </span>
          </div>
          {/* The meter is driven by the same number, so the bar and the score
              can never disagree — and neither depends on an animation finishing. */}
          <div className="sample-meter"><div style={{ width: `${score}%` }} /></div>

          <div className="sample-group">
            <div className="sample-group-label">Can prove</div>
            <div className="sample-chips">
              <span className="chip green">MySQL</span>
              <span className="chip green">Python</span>
              <span className="chip green">React</span>
            </div>
          </div>

          <div className="sample-group">
            <div className="sample-group-label">Still to build</div>
            <div className="sample-chips">
              <span className="chip red">Node.js</span>
              <span className="chip red">Docker</span>
              <span className="chip red">AWS</span>
            </div>
          </div>

          <div className="sample-evidence">
            <div className="sample-group-label">Evidence</div>
            <q>Backend server development with JavaScript.</q>
          </div>
        </div>

        <div className="scene-float scene-tag-a">
          <Icon name="checkCircle" size={13} />
          Evidence attached
        </div>
        <div className="scene-float scene-tag-b">
          <span className="scene-tag-mark">5</span>
          skills to build
        </div>
      </div>
    </div>
  )
}

export function OrbScene() {
  return (
    <div className="orb-scene" aria-hidden="true">
      <span className="orb-ring orb-r1" />
      <span className="orb-ring orb-r2" />
      <span className="orb-ring orb-r3" />
      <span className="orb-core" />
      <span className="orb-sat orb-s1" />
      <span className="orb-sat orb-s2" />
    </div>
  )
}

export function IsoSteps() {
  return (
    <svg
      className="iso-steps"
      viewBox="0 0 260 152"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="128" cy="132" rx="88" ry="9" fill="rgba(20, 32, 26, 0.07)" />

      {/* proven */}
      <g>
        <polygon points="54,82 92,82 92,116 54,116" fill="var(--sage-strong)" />
        <polygon points="54,82 64,72 102,72 92,82" fill="var(--sage)" />
        <polygon points="92,82 102,72 102,106 92,116" fill="#aebfa9" />
      </g>

      {/* building */}
      <g>
        <polygon points="104,58 142,58 142,116 104,116" fill="var(--forest-soft)" />
        <polygon points="104,58 114,48 152,48 142,58" fill="var(--sage-strong)" />
        <polygon points="142,58 152,48 152,106 142,116" fill="var(--forest)" />
      </g>

      {/* target */}
      <g>
        <polygon points="154,32 192,32 192,116 154,116" fill="var(--forest)" />
        <polygon points="154,32 164,22 202,22 192,32" fill="var(--marigold)" />
        <polygon points="192,32 202,22 202,106 192,116" fill="var(--forest-deep)" />
      </g>

      <text x="73" y="139" textAnchor="middle" fontSize="8.5" letterSpacing=".04em" fill="var(--muted)">prove</text>
      <text x="123" y="139" textAnchor="middle" fontSize="8.5" letterSpacing=".04em" fill="var(--muted)">build</text>
      <text x="173" y="139" textAnchor="middle" fontSize="8.5" letterSpacing=".04em" fill="var(--muted)">target</text>
    </svg>
  )
}

export function RailStack() {
  return (
    <div className="rail-stack" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}
