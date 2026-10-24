"""
AI Legal Document Simplifier & Risk Analyzer
Main FastAPI Application
Team-2: Bandari Sushanth, Vooturi Sanvika, Rampogu Dharani, Challakonda Rohith Reddy
"""

import os
import uuid
import json
import asyncio
import tempfile
import logging
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiofiles

from services.document_processor import DocumentProcessor
from services.analyzer import LegalAnalyzer
from services.rag_service import RAGService
from services.report_generator import ReportGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory session store (use Redis/DB in production)
sessions: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 AI Legal Document Analyzer starting up...")
    Path("uploads").mkdir(exist_ok=True)
    Path("reports").mkdir(exist_ok=True)
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="AI Legal Document Simplifier & Risk Analyzer",
    description="Upload any contract → understand it in minutes → know the risks before you sign.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
doc_processor = DocumentProcessor()
analyzer = LegalAnalyzer()
rag_service = RAGService()
report_generator = ReportGenerator()

# ─────────────────────────────────────────────
#  Pydantic Models
# ─────────────────────────────────────────────

class AnalysisStatus(BaseModel):
    session_id: str
    status: str  # "processing" | "ready" | "error"
    progress: int  # 0-100
    current_step: str
    error: Optional[str] = None

class QuestionRequest(BaseModel):
    session_id: str
    question: str

class AnalysisResult(BaseModel):
    session_id: str
    status: str
    filename: str
    doc_type: str
    summary: str
    overall_risk: str
    risk_score: int
    risk_color: str
    clauses: list
    risk_flags: list
    financial_snapshot: dict
    deadlines: list
    suspicious_clauses: list
    disclaimer: str

# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "AI Legal Document Analyzer is running"}


@app.post("/api/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload a document and start analysis."""
    # Validate file type
    allowed_types = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/msword": ".doc",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/tiff": ".tiff",
    }

    # Check extension as fallback
    ext = Path(file.filename).suffix.lower()
    if file.content_type not in allowed_types and ext not in [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".tiff"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PDF, DOCX, or image files."
        )

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "status": "processing",
        "progress": 0,
        "current_step": "Uploading document...",
        "result": None,
        "error": None,
        "filename": file.filename,
        "text": None,
    }

    # Save uploaded file
    upload_path = Path("uploads") / f"{session_id}{ext}"
    content = await file.read()

    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(content)

    # Start background analysis
    background_tasks.add_task(
        analyze_document_task,
        session_id=session_id,
        file_path=str(upload_path),
        filename=file.filename,
        content_type=file.content_type or f"application/{ext.strip('.')}",
    )

    return {"session_id": session_id, "message": "Document uploaded. Analysis started."}


async def analyze_document_task(session_id: str, file_path: str, filename: str, content_type: str):
    """Background task: extract text → analyze → build RAG index."""
    try:
        # Step 1: Extract text
        sessions[session_id].update({"progress": 10, "current_step": "Extracting text from document..."})
        text = await asyncio.to_thread(doc_processor.extract_text, file_path, content_type)
        sessions[session_id]["text"] = text

        if not text or len(text.strip()) < 50:
            raise ValueError("Could not extract sufficient text from the document. Please check the file quality.")

        # Step 2: Classify document
        sessions[session_id].update({"progress": 25, "current_step": "Identifying document type..."})
        doc_type = await asyncio.to_thread(analyzer.classify_document, text)

        # Step 3: Build RAG index
        sessions[session_id].update({"progress": 40, "current_step": "Indexing document for Q&A..."})
        await asyncio.to_thread(rag_service.build_index, session_id, text)

        # Step 4: Full LLM analysis
        sessions[session_id].update({"progress": 60, "current_step": "Analyzing clauses and risks..."})
        analysis = await asyncio.to_thread(analyzer.analyze_document, text, doc_type)

        # Step 5: Finalize
        sessions[session_id].update({"progress": 90, "current_step": "Preparing your report..."})

        result = {
            "session_id": session_id,
            "status": "ready",
            "filename": filename,
            "doc_type": doc_type,
            **analysis,
            "disclaimer": (
                "⚠️ IMPORTANT DISCLAIMER: This analysis is generated by an AI system and is provided for "
                "informational and educational purposes only. It does NOT constitute legal advice. "
                "Risk scores and clause interpretations are heuristic and may be incomplete or incorrect. "
                "Always consult a qualified legal professional before signing any contract."
            )
        }

        sessions[session_id].update({
            "status": "ready",
            "progress": 100,
            "current_step": "Analysis complete!",
            "result": result,
        })

    except Exception as e:
        logger.exception(f"Analysis failed for session {session_id}: {e}")
        sessions[session_id].update({
            "status": "error",
            "progress": 0,
            "current_step": "Analysis failed.",
            "error": str(e),
        })


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    """Poll analysis status and progress."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    s = sessions[session_id]
    return {
        "session_id": session_id,
        "status": s["status"],
        "progress": s["progress"],
        "current_step": s["current_step"],
        "error": s.get("error"),
    }


@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    """Get full analysis result."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    s = sessions[session_id]
    if s["status"] != "ready":
        raise HTTPException(status_code=400, detail=f"Analysis not ready. Current status: {s['status']}")

    return s["result"]


@app.post("/api/chat")
async def chat(request: QuestionRequest):
    """Answer a question grounded in the uploaded document."""
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    s = sessions[request.session_id]
    if s["status"] != "ready":
        raise HTTPException(status_code=400, detail="Document not yet analyzed")

    text = s.get("text", "")
    doc_type = s["result"].get("doc_type", "legal document")

    try:
        answer = await asyncio.to_thread(
            rag_service.answer_question,
            request.session_id,
            request.question,
            text,
            doc_type
        )
        return {"answer": answer, "question": request.question}
    except Exception as e:
        logger.exception(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/{session_id}")
async def download_report(session_id: str):
    """Generate and download a PDF review report."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    s = sessions[session_id]
    if s["status"] != "ready":
        raise HTTPException(status_code=400, detail="Analysis not ready")

    try:
        report_path = await asyncio.to_thread(
            report_generator.generate_pdf,
            session_id,
            s["result"]
        )
        return FileResponse(
            path=report_path,
            media_type="application/pdf",
            filename=f"legal_review_{session_id[:8]}.pdf"
        )
    except Exception as e:
        logger.exception(f"Report generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
