// ScoreChart.jsx — a doughnut chart (Chart.js) showing the skill-match score.
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

export default function ScoreChart({ score }) {
  const data = {
    labels: ['Matched skills', 'Skill gap'],
    datasets: [
      {
        data: [score, Math.max(0, 100 - score)],
        backgroundColor: ['#22c55e', '#fecaca'],
        borderWidth: 0,
      },
    ],
  }
  const options = {
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  }
  return (
    <div className="score-chart">
      <Doughnut data={data} options={options} />
      <div className="score-big">{score}%</div>
    </div>
  )
}
