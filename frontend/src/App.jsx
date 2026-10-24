import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import logo from './assets/logo.png'
import './index.css'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [filename, setFilename] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontFamily: 'inherit' }
        }}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Syneisis AI Logo" className="w-10 h-10 rounded-xl object-cover shadow-md" />
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight">
                Syneisis AI
              </h1>
              <p className="text-xs text-slate-500">Legal Document Simplifier &amp; Risk Analyzer</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {sessionId && (
              <button
                onClick={() => { setSessionId(null); setFilename(''); }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                ← New Document
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!sessionId ? (
          <UploadPage
            onUploadSuccess={(sid, fname) => {
              setSessionId(sid)
              setFilename(fname)
            }}
          />
        ) : (
          <AnalysisPage
            sessionId={sessionId}
            filename={filename}
            onBack={() => { setSessionId(null); setFilename(''); }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">Syneisis AI – Legal Document Simplifier &amp; Risk Analyzer</p>
          <p className="text-red-500 font-medium mt-2">
            ⚠️ This tool is for informational purposes only and does NOT constitute legal advice.
            Always consult a qualified legal professional before signing any contract.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
