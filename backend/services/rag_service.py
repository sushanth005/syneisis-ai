"""
RAG Service
Retrieval-Augmented Generation for document Q&A.
Uses sentence-transformers for embeddings + FAISS for retrieval + Groq for answers.
"""

import os
import re
import logging
import numpy as np
from typing import List, Tuple
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class RAGService:
    """Document Q&A using retrieval-augmented generation."""

    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        self.model = "openai/gpt-oss-120b"
        self.indexes: dict = {}  # session_id -> {"chunks": [...], "embeddings": np.array}
        self._encoder = None

    @property
    def encoder(self):
        """Lazy-load the sentence encoder."""
        if self._encoder is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading sentence-transformers model...")
                self._encoder = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("Sentence encoder loaded.")
            except Exception as e:
                logger.warning(f"Could not load sentence-transformers: {e}")
                self._encoder = None
        return self._encoder

    def _chunk_text(self, text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks, respecting paragraph boundaries."""
        # Split by paragraphs first
        paragraphs = re.split(r"\n\s*\n", text)
        chunks = []
        current_chunk = []
        current_len = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            words = para.split()
            if current_len + len(words) > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Keep overlap words
                current_chunk = current_chunk[-overlap:] if overlap > 0 else []
                current_len = len(current_chunk)

            current_chunk.extend(words)
            current_len += len(words)

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks if chunks else [text[:3000]]

    def build_index(self, session_id: str, text: str):
        """Build a FAISS vector index for the document."""
        chunks = self._chunk_text(text)
        logger.info(f"Building RAG index for session {session_id}: {len(chunks)} chunks")

        if self.encoder is not None:
            try:
                embeddings = self.encoder.encode(chunks, show_progress_bar=False, normalize_embeddings=True)
                self.indexes[session_id] = {
                    "chunks": chunks,
                    "embeddings": embeddings,
                    "use_faiss": False,
                }
                # Try to build FAISS index
                try:
                    import faiss
                    dim = embeddings.shape[1]
                    index = faiss.IndexFlatIP(dim)  # Inner product for cosine sim (normalized)
                    index.add(embeddings.astype(np.float32))
                    self.indexes[session_id]["faiss_index"] = index
                    self.indexes[session_id]["use_faiss"] = True
                    logger.info("FAISS index built successfully")
                except Exception as e:
                    logger.warning(f"FAISS not available, using numpy similarity: {e}")
                return
            except Exception as e:
                logger.warning(f"Embedding failed: {e}")

        # Fallback: store chunks without embeddings (keyword search)
        self.indexes[session_id] = {
            "chunks": chunks,
            "embeddings": None,
            "use_faiss": False,
        }

    def _retrieve(self, session_id: str, query: str, top_k: int = 5) -> List[str]:
        """Retrieve the most relevant chunks for a query."""
        if session_id not in self.indexes:
            return []

        idx_data = self.indexes[session_id]
        chunks = idx_data["chunks"]

        if idx_data.get("embeddings") is not None and self.encoder is not None:
            query_emb = self.encoder.encode([query], normalize_embeddings=True)

            if idx_data.get("use_faiss") and "faiss_index" in idx_data:
                import faiss
                scores, indices = idx_data["faiss_index"].search(
                    query_emb.astype(np.float32), min(top_k, len(chunks))
                )
                return [chunks[i] for i in indices[0] if i < len(chunks)]
            else:
                # Numpy cosine similarity
                sims = np.dot(idx_data["embeddings"], query_emb.T).flatten()
                top_indices = np.argsort(sims)[::-1][:top_k]
                return [chunks[i] for i in top_indices]

        # Keyword fallback
        query_words = set(query.lower().split())
        scored = []
        for chunk in chunks:
            chunk_words = set(chunk.lower().split())
            score = len(query_words & chunk_words)
            scored.append((score, chunk))
        scored.sort(reverse=True)
        return [c for _, c in scored[:top_k] if _ > 0] or chunks[:3]

    def answer_question(self, session_id: str, question: str, full_text: str, doc_type: str) -> str:
        """Answer a user question grounded in the document."""
        if not self.client:
            return "Please configure GROQ_API_KEY to enable the Q&A feature."

        relevant_chunks = self._retrieve(session_id, question, top_k=5)
        context = "\n\n---\n\n".join(relevant_chunks)

        system_prompt = f"""You are a helpful legal document assistant. You help ordinary people understand their {doc_type}.
Your answers are:
- Based ONLY on the document content provided
- In plain, simple English (avoid legal jargon)
- Honest about uncertainty — if the document doesn't address the question, say so
- Practical and actionable

IMPORTANT: Always end with "⚠️ This is informational only — not legal advice. Consult a qualified lawyer for your specific situation."
"""

        user_prompt = f"""The user is asking about their {doc_type}.

RELEVANT SECTIONS FROM THE DOCUMENT:
{context}

USER'S QUESTION: {question}

Please answer the question based on the document content above. If the answer is not in the document, say "The document doesn't specifically address this question."
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1024,
                temperature=0.2,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.exception(f"Q&A error: {e}")
            return f"Sorry, I couldn't process that question. Error: {str(e)}"
