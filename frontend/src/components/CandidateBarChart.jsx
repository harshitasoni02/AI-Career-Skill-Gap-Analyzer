// CandidateBarChart.jsx — a bar chart comparing all candidates' scores.
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const COLORS = ['#16a34a', '#2563eb', '#7c3aed', '#d97706', '#0891b2', '#dc2626']

export default function CandidateBarChart({ candidates }) {
  const data = {
    labels: candidates.map((c) => c.parsed_name || c.filename),
    datasets: [
      {
        label: 'Skill match %',
        data: candidates.map((c) => c.score),
        backgroundColor: candidates.map((c, i) => COLORS[i % COLORS.length]),
        borderRadius: 6,
      },
    ],
  }
  const options = {
    scales: { y: { min: 0, max: 100 } },
    plugins: { legend: { display: false } },
  }
  return <Bar data={data} options={options} />
}
