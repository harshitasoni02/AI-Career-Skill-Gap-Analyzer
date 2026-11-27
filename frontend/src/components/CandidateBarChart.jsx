// CandidateBarChart.jsx — a quiet comparison chart for ranked candidates.
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const COLORS = ['#d8a02a', '#1b4a3a', '#7c9b8a', '#a44b3c', '#5d6f64', '#b8c3b4']
const SANS = "'Instrument Sans Variable', 'Segoe UI', sans-serif"

export default function CandidateBarChart({ candidates }) {
  const data = {
    labels: candidates.map((c) => c.parsed_name || c.filename),
    datasets: [
      {
        label: 'Weighted match',
        data: candidates.map((c) => c.score),
        backgroundColor: candidates.map((c, i) => COLORS[i % COLORS.length]),
        borderRadius: 2,
        maxBarThickness: 64,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8 } },
    scales: {
      y: {
        min: 0,
        max: 100,
        border: { display: false },
        grid: { color: '#e2e8de', drawTicks: false },
        ticks: {
          color: '#5e6b64',
          padding: 8,
          font: { family: SANS, size: 11 },
          callback: (v) => `${v}%`,
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#34433c',
          font: { family: SANS, size: 12 },
          maxRotation: 0,
          autoSkip: false,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0e2d24',
        titleFont: { family: SANS, size: 12, weight: '600' },
        bodyFont: { family: SANS, size: 12 },
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
        callbacks: { label: (ctx) => `${ctx.parsed.y}% weighted match` },
      },
    },
  }

  return (
    <div className="chart-frame">
      <Bar data={data} options={options} />
    </div>
  )
}
