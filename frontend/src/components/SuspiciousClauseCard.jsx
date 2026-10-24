import React from 'react'
import { AlertTriangle, AlertCircle, Shield } from 'lucide-react'

export default function SuspiciousClauseCard({ clause }) {
  const isHigh = clause.risk_level === 'High'

  return (
    <div className={`border-2 rounded-xl overflow-hidden ${isHigh ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}>
      <div className={`flex items-center justify-between px-4 py-3 ${isHigh ? 'bg-red-100' : 'bg-amber-100'}`}>
        <div className="flex items-center gap-3">
          {isHigh
            ? <AlertTriangle className="w-5 h-5 text-red-600" />
            : <AlertCircle className="w-5 h-5 text-amber-600" />
          }
          <span className={`font-bold text-sm ${isHigh ? 'text-red-900' : 'text-amber-900'}`}>
            {clause.type}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isHigh ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
          {clause.risk_level} Risk
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-slate-700 leading-relaxed">{clause.description}</p>
        {clause.recommendation && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${isHigh ? 'bg-red-100 border border-red-200' : 'bg-amber-100 border border-amber-200'}`}>
            <Shield className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isHigh ? 'text-red-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-xs font-semibold mb-0.5 ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>What to do</p>
              <p className="text-xs text-slate-700">{clause.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
