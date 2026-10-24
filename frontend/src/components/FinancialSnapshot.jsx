import React from 'react'
import { DollarSign, Info } from 'lucide-react'

const FREQ_COLORS = {
  'Monthly': 'bg-blue-50 text-blue-700 border-blue-200',
  'Annual': 'bg-purple-50 text-purple-700 border-purple-200',
  'One-time': 'bg-green-50 text-green-700 border-green-200',
  'default': 'bg-slate-50 text-slate-700 border-slate-200',
}

export default function FinancialSnapshot({ financial }) {
  const items = financial?.items || []
  const currencyNote = financial?.currency_note || ''

  if (items.length === 0) {
    return (
      <div className="card">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Financial Snapshot
        </h3>
        <div className="text-center py-8 text-slate-400">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No financial obligations identified in this document.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Financial Snapshot
        </h3>
        {currencyNote && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
            <Info className="w-3.5 h-3.5" />
            {currencyNote}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 rounded-xl">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-l-xl">Item</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Frequency</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-r-xl">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => {
              const freqColor = FREQ_COLORS[item.frequency] || FREQ_COLORS.default
              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.label}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-base font-bold text-green-700">{item.amount}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${freqColor}`}>
                      {item.frequency || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.note || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
