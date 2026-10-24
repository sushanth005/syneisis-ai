import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, User, Loader2, AlertTriangle, Lightbulb } from 'lucide-react'
import assistantImg from '../assets/assistant.png'

const SUGGESTED_QUESTIONS = [
  "Can I terminate this contract early?",
  "What happens if I miss a payment?",
  "What are my main obligations?",
  "Are there any automatic renewals?",
  "What are the penalty clauses?",
  "Can the other party change the terms?",
  "What is the notice period for termination?",
]

export default function ChatSection({ sessionId, docType }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm Vakeel Assistant, your AI legal guide for this ${docType || 'document'}. Ask me anything about it — in plain English. I'll answer based only on what's in your document.\n\n⚠️ Remember: My answers are informational only, not legal advice.`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (question) => {
    const q = question || input.trim()
    if (!q || loading) return

    setMessages(prev => [...prev, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat', {
        session_id: sessionId,
        question: q,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Sorry, I encountered an error. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errMsg}`, isError: true }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Chat Window */}
      <div className="lg:col-span-2 card flex flex-col" style={{ height: '600px' }}>
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <img src={assistantImg} alt="Vakeel Assistant" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
          <div>
            <p className="font-bold text-slate-900">Vakeel Assistant</p>
            <p className="text-xs text-slate-500">Grounded in your document · Not legal advice</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                msg.role === 'user'
                  ? 'bg-blue-600'
                  : ''
              }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <img src={assistantImg} alt="Vakeel" className="w-8 h-8 object-cover" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-md'
                  : msg.isError
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-md'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-md'
              }`}>
                {msg.content.split('\n').map((line, li) =>
                  line ? <p key={li} className={li > 0 ? 'mt-2' : ''}>{line}</p> : <br key={li} />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={assistantImg} alt="Vakeel" className="w-8 h-8 object-cover" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your document..."
              disabled={loading}
              rows={2}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 bg-white"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-12 h-full min-h-[60px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900">Suggested Questions</h3>
          </div>
          <div className="space-y-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="w-full text-left text-sm text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl px-3 py-2.5 transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-1">Grounded Answers</p>
              <p className="text-xs text-amber-700">
                All answers are based only on the content of your uploaded document.
                The AI will tell you if something isn't covered in the document.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
