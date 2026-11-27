// ScoreChart.jsx — a restrained SVG ring for the weighted match score.
export default function ScoreChart({ score }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0))
  const radius = 82
  const circumference = 2 * Math.PI * radius

  return (
    <div className="score-chart" role="img" aria-label={`${score}% weighted match`}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="score-ring-track" cx="100" cy="100" r={radius} />
        <circle
          className="score-ring-value"
          cx="100"
          cy="100"
          r={radius}
          strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="score-big">{score}%</div>
      <div className="score-caption">weighted match</div>
    </div>
  )
}
