import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Shield, Zap, Clock, MessageSquare, AlertTriangle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/tiff': ['.tiff'],
}

const FEATURES = [
  { icon: FileText, title: 'Smart Text Extraction', desc: 'Supports PDF, DOCX, and scanned images with OCR' },
  { icon: Shield, title: 'Risk Scoring', desc: 'Low / Medium / High risk classification per clause' },
  { icon: AlertTriangle, title: 'Suspicious Clause Detector', desc: 'Auto-renewals, unlimited liability, unilateral changes' },
  { icon: Zap, title: 'Plain English Summaries', desc: 'Every clause explained in simple, clear language' },
  { icon: Clock, title: 'Deadline Tracker', desc: 'Key dates, payment obligations, and penalties extracted' },
  { icon: MessageSquare, title: 'AI Chat Q&A', desc: 'Ask anything about your document, get grounded answers' },
]

const DOC_TYPES = [
  'Rental/Lease Agreement', 'Employment Contract', 'NDA', 'Loan Agreement',
  'Service Agreement', 'Insurance Policy', 'Terms & Conditions', 'Freelance Contract',
]

export default function UploadPage({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  })

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setUploading(true)
    try {
      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Document uploaded! Starting analysis...')
      onUploadSuccess(data.session_id, selectedFile.name)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed. Please try again.'
      toast.error(msg)
      setUploading(false)
    }
  }

  const formatFileSize = bytes => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-blue-200">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Powered by Groq · Llama 3.1 · RAG Technology
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
          Understand Any Contract
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            In Minutes, Not Hours
          </span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload any legal document — rental agreement, employment contract, NDA, loan agreement — 
          and get instant plain-English explanations, risk scores, and questions to ask before you sign.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Upload Zone */}
        <div className="lg:col-span-3 space-y-4">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
              }
            `}
          >
            <input {...getInputProps()} />

            {selectedFile ? (
              <div className="animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-slate-800 text-lg">{selectedFile.name}</p>
                <p className="text-slate-500 text-sm mt-1">{formatFileSize(selectedFile.size)}</p>
                <p className="text-green-600 text-sm mt-3 font-medium">✓ File ready to analyze</p>
                <p className="text-slate-400 text-xs mt-2">Click or drag to replace</p>
              </div>
            ) : isDragActive ? (
              <div>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-blue-600 font-semibold text-lg">Drop your document here!</p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 text-lg mb-2">
                  Drag & drop your legal document
                </p>
                <p className="text-slate-500 text-sm mb-4">or click to browse files</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['PDF', 'DOCX', 'DOC', 'PNG', 'JPG', 'TIFF'].map(type => (
                    <span key={type} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-slate-400 text-xs mt-3">Maximum file size: 20 MB</p>
              </div>
            )}
          </div>

          {fileRejections.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {fileRejections[0].errors[0].message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full btn-primary flex items-center justify-center gap-3 text-base py-4"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading & starting analysis...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Document
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Privacy Notice</p>
              <p className="text-amber-700 mt-0.5">
                Your document is processed on our servers and not stored permanently. 
                For highly sensitive documents, consult a lawyer directly.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar: Features & Doc Types */}
        <div className="lg:col-span-2 space-y-6">
          {/* Features */}
          <div className="card">
            <h3 className="font-bold text-slate-900 mb-4 text-lg">What you'll get</h3>
            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported Doc Types */}
          <div className="card">
            <h3 className="font-bold text-slate-900 mb-3 text-lg">Supported Document Types</h3>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map(type => (
                <span key={type} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {type}
                </span>
              ))}
              <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">
                + More
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-xs text-red-700 font-semibold mb-1">⚠️ Important Disclaimer</p>
            <p className="text-xs text-red-600">
              This tool provides informational analysis only and does NOT constitute legal advice. 
              Risk assessments are AI-generated heuristics, not professional legal judgments. 
              Always consult a qualified attorney before signing any legal document.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
