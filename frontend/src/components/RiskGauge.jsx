import React from 'react'

export default function RiskGauge({ score, level, color }) {
  // SVG arc-based gauge
  const radius = 70
  const strokeWidth = 14
  const cx = 100
  const cy = 90
  const startAngle = -180
  const endAngle = 0
  const totalAngle = endAngle - startAngle

  const polarToCartesian = (angle) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  const arcPath = (start, end) => {
    const s = polarToCartesian(start)
    const e = polarToCartesian(end)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  const scoreAngle = startAngle + (score / 100) * totalAngle

  // Needle endpoint
  const needleAngle = scoreAngle
  const needleLen = radius - 10
  const needleEnd = {
    x: cx + needleLen * Math.cos((needleAngle * Math.PI) / 180),
    y: cy + needleLen * Math.sin((needleAngle * Math.PI) / 180),
  }

  const trackColor = '#e2e8f0'
  const fillColor = color || (level === 'Low' ? '#22c55e' : level === 'High' ? '#ef4444' : '#f59e0b')

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48 h-28">
        {/* Background arc (grey track) */}
        <path
          d={arcPath(startAngle, endAngle)}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored fill arc */}
        {score > 0 && (
          <path
            d={arcPath(startAngle, scoreAngle)}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke="#334155"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r={5} fill="#334155" />

        {/* Labels */}
        <text x="22" y="105" fontSize="9" fill="#94a3b8" textAnchor="middle">Low</text>
        <text x="100" y="22" fontSize="9" fill="#94a3b8" textAnchor="middle">Medium</text>
        <text x="178" y="105" fontSize="9" fill="#94a3b8" textAnchor="middle">High</text>
      </svg>

      <div className="text-center -mt-2">
        <p className="text-4xl font-black" style={{ color: fillColor }}>{score}</p>
        <p className="text-sm text-slate-500 font-medium">/ 100 Risk Score</p>
      </div>
    </div>
  )
}
