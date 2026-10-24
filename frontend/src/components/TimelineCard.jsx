import React from 'react'
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

const URGENCY_CONFIG = {
  High: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300', dot: 'bg-red-500' },
  Medium: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300', dot: 'bg-amber-500' },
  Low: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300', dot: 'bg-green-500' },
}

export default function TimelineCard({ deadline, index }) {
  const config = URGENCY_CONFIG[deadline.urgency] || URGENCY_CONFIG.Low
  const Icon = config.icon

  return (
    <div className="flex items-start gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} border ${config.border}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="w-0.5 h-full bg-slate-200 mt-1 min-h-4"></div>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex-1 mb-3 shadow-sm">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-slate-800 text-sm">{deadline.event}</h4>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.color} border ${config.border}`}>
            {deadline.urgency}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium text-slate-700">{deadline.date_info}</span>
        </div>
        {deadline.consequence && (
          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <strong>If missed:</strong> {deadline.consequence}
          </p>
        )}
      </div>
    </div>
  )
}
