import React, { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

const RISK_CONFIG = {
  High: {
    badge: 'bg-red-100 text-red-700 border-red-300',
    border: 'border-l-red-500',
    bg: 'hover:bg-red-50/30',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
  Medium: {
    badge: 'bg-amber-100 text-amber-700 border-amber-300',
    border: 'border-l-amber-500',
    bg: 'hover:bg-amber-50/30',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
  },
  Low: {
    badge: 'bg-green-100 text-green-700 border-green-300',
    border: 'border-l-green-500',
    bg: 'hover:bg-green-50/30',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
}

export default function ClauseCard({ clause, index }) {
  const [expanded, setExpanded] = useState(clause.risk_level === 'High')
  const config = RISK_CONFIG[clause.risk_level] || RISK_CONFIG.Low
  const Icon = config.icon

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${config.border} rounded-xl overflow-hidden shadow-sm transition-all duration-200`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 text-left ${config.bg} transition-colors`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
            {index}
          </div>
          <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
          <span className="font-semibold text-slate-800 truncate">{clause.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${config.badge}`}>
            {clause.risk_level}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-4 animate-fade-in border-t border-slate-100">
          {/* Original text */}
          {clause.original && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Original Language</p>
              <p className="text-sm text-slate-600 italic leading-relaxed">{clause.original}</p>
            </div>
          )}

          {/* Plain English */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">📖 Plain English</p>
            <p className="text-sm text-slate-700 leading-relaxed">{clause.explanation}</p>
          </div>

          {/* Why it matters */}
          {clause.risk_reason && (
            <div className={`rounded-lg p-3 ${config.badge.includes('red') ? 'bg-red-50 border border-red-200' : config.badge.includes('amber') ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">⚠️ Why This Matters</p>
              <p className="text-sm leading-relaxed">{clause.risk_reason}</p>
            </div>
          )}

          {/* Recommendation */}
          {clause.recommendation && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">✅ Recommendation</p>
              <p className="text-sm text-slate-700 leading-relaxed">{clause.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
