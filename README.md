# AI Legal Document Simplifier & Risk Analyzer

**Team-2 | CSE-Q | 3rd B.Tech, 1st Semester**

| Name | Roll No |
|------|---------|
| Bandari Sushanth | 24EG105Q31 |
| Vooturi Sanvika | 24EG105Q61 |
| Rampogu Dharani | 24EG105Q54 |
| Challakonda Rohith Reddy | 24EG105Q34 |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ 
- Node.js 18+
- A free [Groq API Key](https://console.groq.com) (takes 2 minutes to get)

### Step 1: Get Your Groq API Key
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up (free) → Create API Key
3. Copy the key

### Step 2: Set the API Key
Open `backend/.env` and replace `your_groq_api_key_here`:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### Step 3: Run the Application
**Windows:** Double-click `start.bat`

**Or manually:**
```powershell
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000**

---

## 📁 Project Structure

```
Doc_Analyzer/
├── start.bat                    # One-click startup script
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # API keys (set GROQ_API_KEY here)
│   └── services/
│       ├── document_processor.py  # PDF/DOCX/Image text extraction + OCR
│       ├── analyzer.py            # Groq LLM analysis (classification + risk)
│       ├── rag_service.py         # RAG Q&A (FAISS + sentence-transformers)
│       └── report_generator.py    # PDF report generation (ReportLab)
└── frontend/
    ├── src/
    │   ├── App.jsx               # Root component
    │   ├── pages/
    │   │   ├── UploadPage.jsx    # Drag-and-drop upload interface
    │   │   └── AnalysisPage.jsx  # Full analysis dashboard
    │   └── components/
    │       ├── ClauseCard.jsx         # Expandable clause cards
    │       ├── SuspiciousClauseCard.jsx  # Suspicious clause alerts
    │       ├── TimelineCard.jsx       # Deadline timeline items
    │       ├── FinancialSnapshot.jsx  # Financial obligations table
    │       ├── RiskGauge.jsx          # SVG risk score gauge
    │       └── ChatSection.jsx        # AI Q&A chat interface
    └── vite.config.js            # Vite + proxy config
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 Multi-format Upload | PDF, DOCX, DOC, PNG, JPG, TIFF |
| 🔍 OCR Support | Scanned documents via Tesseract/EasyOCR |
| 🤖 Document Classification | Automatic type detection (rental, NDA, etc.) |
| 📝 Plain-English Summary | 2-3 paragraph document overview |
| ⚖️ Clause Analysis | Every clause explained + risk rated |
| 🚨 Suspicious Clause Detector | Auto-renewals, unlimited liability, etc. |
| 💰 Financial Snapshot | All monetary obligations in one table |
| 📅 Deadline Tracker | Key dates and consequences |
| 💬 AI Chat Q&A | Ask anything, get grounded answers |
| 📊 Risk Gauge | Visual 0-100 risk score |
| 📥 PDF Report | Downloadable review report |

---

## 🛠️ Tech Stack

**Backend:** FastAPI · Groq (Llama 3.1) · FAISS · sentence-transformers · pdfplumber · PyMuPDF · python-docx · ReportLab

**Frontend:** React · Vite · Tailwind CSS · Axios · react-dropzone · react-hot-toast

---

## ⚠️ Disclaimer

This tool provides AI-generated informational analysis only. It does **NOT** constitute legal advice. Always consult a qualified legal professional before signing any contract.
