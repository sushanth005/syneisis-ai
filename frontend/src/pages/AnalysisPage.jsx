import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  FileText, Shield, AlertTriangle, Clock, DollarSign,
  MessageSquare, Download, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Info, ArrowLeft, HelpCircle,
  TrendingUp, Target
} from 'lucide-react'
import ChatSection from '../components/ChatSection'
import RiskGauge from '../components/RiskGauge'
import ClauseCard from '../components/ClauseCard'
import SuspiciousClauseCard from '../components/SuspiciousClauseCard'
import TimelineCard from '../components/TimelineCard'
import FinancialSnapshot from '../components/FinancialSnapshot'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'clauses', label: 'Clauses', icon: FileText },
  { id: 'risks', label: 'Risk Analysis', icon: Shield },
  { id: 'timeline', label: 'Timeline & Finance', icon: Clock },
  { id: 'chat', label: 'Ask AI', icon: MessageSquare },
]

const STEPS = [
  'Extracting text from document...',
  'Identifying document type...',
  'Indexing document for Q&A...',
  'Analyzing clauses and risks...',
  'Preparing your report...',
]

export default function AnalysisPage({ sessionId, filename, onBack }) {
  const [status, setStatus] = useState({ status: 'processing', progress: 0, current_step: STEPS[0] })
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [downloading, setDownloading] = useState(false)

  // Poll for status
  const pollStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/status/${sessionId}`)
      setStatus(data)

      if (data.status === 'ready') {
        const { data: resultData } = await axios.get(`/api/result/${sessionId}`)
        setResult(resultData)
        toast.success('Analysis complete! Your document is ready.')
      } else if (data.status === 'error') {
        toast.error(`Analysis failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Status poll error:', err)
    }
  }, [sessionId])

  useEffect(() => {
    pollStatus()
    const interval = setInterval(() => {
      if (status.status === 'processing') {
        pollStatus()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [pollStatus, status.status])

  const handleDownloadReport = async () => {
    setDownloading(true)
    try {
      const response = await axios.get(`/api/report/${sessionId}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `legal_review_${sessionId.slice(0, 8)}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch (err) {
      toast.error('Could not generate report. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  const getRiskConfig = (level) => ({
    Low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', badge: 'risk-badge-low', icon: CheckCircle },
    Medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', badge: 'risk-badge-medium', icon: AlertCircle },
    High: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', badge: 'risk-badge-high', icon: AlertTriangle },
  }[level] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-300', badge: '', icon: Info })

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (status.status === 'processing') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Document</h2>
          <p className="text-slate-500 mb-2 text-sm font-medium">{filename}</p>
          <p className="text-blue-600 font-medium mb-8">{status.current_step}</p>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
            <div
              className="h-3 rounded-full progress-bar-animated transition-all duration-700"
              style={{ width: `${status.progress}%` }}
            ></div>
          </div>
          <p className="text-slate-500 text-sm">{status.progress}% complete</p>

          {/* Steps */}
          <div className="mt-10 space-y-2">
            {STEPS.map((step, i) => {
              const stepProgress = (i + 1) * 20
              const isDone = status.progress >= stepProgress
              const isCurrent = status.current_step === step
              return (
                <div key={step} className={`flex items-center gap-3 text-sm p-2 rounded-lg transition-colors ${isCurrent ? 'bg-blue-50' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-green-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'}`}>
                    {isDone && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={isDone ? 'text-green-700 font-medium' : isCurrent ? 'text-blue-700 font-medium' : 'text-slate-400'}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────────────────────────
  if (status.status === 'error') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h2>
          <p className="text-slate-600 text-sm mb-6">{status.error}</p>
          <button onClick={onBack} className="btn-primary">
            ← Try Another Document
          </button>
        </div>
      </div>
    )
  }

  if (!result) return null

  const riskConfig = getRiskConfig(result.overall_risk)
  const RiskIcon = riskConfig.icon

  // ─── Results Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Analyze another document
          </button>
          <h2 className="text-xl font-bold text-slate-900 truncate max-w-md">{result.filename}</h2>
          <p className="text-sm text-slate-500">{result.doc_type}</p>
        </div>
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="btn-secondary flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download Review Report'}
        </button>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Informational Only:</strong> This AI analysis is not legal advice. Risk scores are heuristic estimates.
          Always consult a qualified lawyer before signing any contract.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Score */}
        <div className={`card border-2 ${riskConfig.border} ${riskConfig.bg} col-span-2 lg:col-span-1`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Overall Risk</p>
          <div className="flex items-center gap-2">
            <RiskIcon className={`w-8 h-8 ${riskConfig.color}`} />
            <div>
              <p className={`text-2xl font-bold ${riskConfig.color}`}>{result.overall_risk}</p>
              <p className="text-xs text-slate-500">Score: {result.risk_score}/100</p>
            </div>
          </div>
        </div>

        {/* Clauses */}
        <div className="card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Clauses Analyzed</p>
          <p className="text-3xl font-bold text-blue-600">{result.clauses?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Key clauses</p>
        </div>

        {/* Suspicious Clauses */}
        <div className="card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Suspicious Clauses</p>
          <p className={`text-3xl font-bold ${result.suspicious_clauses?.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {result.suspicious_clauses?.length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Flagged items</p>
        </div>

        {/* Deadlines */}
        <div className="card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Deadlines</p>
          <p className="text-3xl font-bold text-purple-600">{result.deadlines?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Important dates</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-1 justify-center
              ${activeTab === id ? 'tab-active' : 'tab-inactive'}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <OverviewTab result={result} riskConfig={riskConfig} />
        )}
        {activeTab === 'clauses' && (
          <ClausesTab clauses={result.clauses || []} />
        )}
        {activeTab === 'risks' && (
          <RisksTab
            riskFlags={result.risk_flags || []}
            suspiciousClauses={result.suspicious_clauses || []}
            questionsToAsk={result.questions_to_ask || []}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineFinanceTab
            deadlines={result.deadlines || []}
            financial={result.financial_snapshot || {}}
          />
        )}
        {activeTab === 'chat' && (
          <ChatSection sessionId={sessionId} docType={result.doc_type} />
        )}
      </div>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ result, riskConfig }) {
  const highRisk = result.clauses?.filter(c => c.risk_level === 'High').length || 0
  const medRisk = result.clauses?.filter(c => c.risk_level === 'Medium').length || 0
  const lowRisk = result.clauses?.filter(c => c.risk_level === 'Low').length || 0

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Document Summary
          </h3>
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
            {result.summary.split('\n').map((para, i) =>
              para.trim() ? <p key={i} className="mb-3">{para}</p> : null
            )}
          </div>

          {/* Key Parties */}
          {result.key_parties?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h4 className="font-semibold text-slate-700 mb-3 text-sm">Key Parties Involved</h4>
              <div className="flex flex-wrap gap-2">
                {result.key_parties.map((p, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <p className="text-xs text-blue-500 font-medium">{p.role}</p>
                    <p className="text-sm text-blue-800 font-semibold">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Gauge */}
        <div className="card flex flex-col items-center justify-center">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Risk Breakdown</h3>
          <RiskGauge score={result.risk_score} level={result.overall_risk} color={result.risk_color} />
          <div className="mt-6 w-full space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>High Risk</span>
              <span className="font-bold text-red-600">{highRisk}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>Medium Risk</span>
              <span className="font-bold text-amber-600">{medRisk}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Low Risk</span>
              <span className="font-bold text-green-600">{lowRisk}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Suspicious Clauses Preview */}
      {result.suspicious_clauses?.length > 0 && (
        <div className="card border-2 border-red-200 bg-red-50/50">
          <h3 className="font-bold text-red-900 text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            ⚠️ Suspicious Clauses Detected ({result.suspicious_clauses.length})
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.suspicious_clauses.slice(0, 4).map((clause, i) => (
              <div key={i} className="bg-white border border-red-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-900 text-sm">{clause.type}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${clause.risk_level === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {clause.risk_level}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{clause.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Clauses Tab ──────────────────────────────────────────────────────────────
function ClausesTab({ clauses }) {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All' ? clauses : clauses.filter(c => c.risk_level === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-bold text-slate-900 text-lg">
          Clause-by-Clause Analysis ({clauses.length} clauses)
        </h3>
        <div className="flex gap-2">
          {['All', 'High', 'Medium', 'Low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? f === 'High' ? 'bg-red-600 text-white'
                    : f === 'Medium' ? 'bg-amber-500 text-white'
                    : f === 'Low' ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map((clause, i) => (
          <ClauseCard key={i} clause={clause} index={i + 1} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No {filter.toLowerCase()} risk clauses found.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Risks Tab ────────────────────────────────────────────────────────────────
function RisksTab({ riskFlags, suspiciousClauses, questionsToAsk }) {
  return (
    <div className="space-y-6">
      {/* Suspicious Clauses */}
      {suspiciousClauses.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Suspicious Clauses
          </h3>
          <div className="space-y-3">
            {suspiciousClauses.map((clause, i) => (
              <SuspiciousClauseCard key={i} clause={clause} />
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Risk Flags
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {riskFlags.map((flag, i) => {
              const colors = {
                High: 'border-red-200 bg-red-50',
                Medium: 'border-amber-200 bg-amber-50',
                Low: 'border-green-200 bg-green-50',
              }
              const textColors = { High: 'text-red-800', Medium: 'text-amber-800', Low: 'text-green-800' }
              return (
                <div key={i} className={`border rounded-xl p-4 ${colors[flag.severity] || 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${textColors[flag.severity] || 'text-slate-600'}`} />
                    <div>
                      <p className={`font-semibold text-sm ${textColors[flag.severity] || 'text-slate-800'}`}>{flag.flag}</p>
                      <p className="text-slate-600 text-xs mt-1">{flag.detail}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Questions to Ask */}
      {questionsToAsk.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            Questions to Ask Before Signing
          </h3>
          <div className="space-y-3">
            {questionsToAsk.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-slate-700 text-sm">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Timeline & Finance Tab ───────────────────────────────────────────────────
function TimelineFinanceTab({ deadlines, financial }) {
  return (
    <div className="space-y-6">
      <FinancialSnapshot financial={financial} />
      <div>
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Important Deadlines & Dates
        </h3>
        {deadlines.length === 0 ? (
          <div className="card text-center text-slate-400 py-8">No specific deadlines identified.</div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((dl, i) => (
              <TimelineCard key={i} deadline={dl} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
