"""
Legal Analyzer Service
Uses Groq LLM (Llama 3.1 / Mixtral) for document classification and comprehensive analysis.
Outputs structured JSON for reliable UI rendering.
"""

import os
import re
import json
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


class LegalAnalyzer:
    """Groq-powered legal document analyzer."""

    def __init__(self):
        if not GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set. Using mock analysis mode.")
        self.client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        self.model = "openai/gpt-oss-20b"  # fast, capable
        self.large_model = "openai/gpt-oss-120b"  # for deep analysis

    def _call_groq(self, system_prompt: str, user_prompt: str, model: str = None, max_tokens: int = 4096) -> str:
        """Make a Groq API call."""
        if not self.client:
            raise RuntimeError(
                "GROQ_API_KEY is not configured. Please add your Groq API key to backend/.env file."
            )
        m = model or self.model
        try:
            response = self.client.chat.completions.create(
                model=m,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
                temperature=0.1,  # Low temperature for consistent, accurate analysis
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.exception(f"Groq API error: {e}")
            raise RuntimeError(f"LLM API error: {str(e)}")

    def _extract_json(self, text: str) -> dict:
        """Robustly extract JSON from LLM output."""
        # Try to find JSON block
        patterns = [
            r"```json\s*([\s\S]+?)\s*```",
            r"```\s*([\s\S]+?)\s*```",
            r"(\{[\s\S]+\})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue

        # Try parsing the whole response
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Could not parse JSON from LLM output")
            return {}

    def classify_document(self, text: str) -> str:
        """Classify the document type."""
        sample = text[:3000]
        system = "You are a legal document classification expert. Respond with only the document type name."
        user = f"""Classify this legal document into one of these categories:
- Rental/Lease Agreement
- Employment Contract
- Non-Disclosure Agreement (NDA)
- Loan Agreement
- Service Agreement
- Purchase Agreement
- Insurance Policy
- Terms & Conditions
- Partnership Agreement
- Freelance Contract
- Licensing Agreement
- Settlement Agreement
- Power of Attorney
- Other Legal Document

Document excerpt:
{sample}

Respond with ONLY the document type (e.g., "Rental/Lease Agreement")."""

        try:
            return self._call_groq(system, user, model=self.model, max_tokens=50).strip()
        except Exception:
            return "Legal Document"

    def _truncate_text(self, text: str, max_chars: int = 12000) -> str:
        """Truncate text to fit within token limits while preserving structure."""
        if len(text) <= max_chars:
            return text
        # Keep beginning and end (most important parts of legal docs)
        half = max_chars // 2
        return text[:half] + "\n\n[... document continues ...]\n\n" + text[-half:]

    def analyze_document(self, text: str, doc_type: str) -> dict:
        """Perform comprehensive legal analysis using structured prompts."""
        truncated = self._truncate_text(text)

        system_prompt = """You are an expert legal analyst specializing in making legal documents accessible to non-lawyers.
Your task is to analyze legal documents and provide clear, actionable insights.
Always respond with valid JSON only. No markdown formatting outside the JSON block.
Be thorough, accurate, and err on the side of flagging more risks."""

        analysis_prompt = f"""Analyze this {doc_type} and return a comprehensive JSON analysis.

DOCUMENT TEXT:
{truncated}

Return ONLY a valid JSON object with this EXACT structure:
{{
  "summary": "2-3 paragraph plain English summary of what this document is about and what it means for the signer",
  "overall_risk": "Low" | "Medium" | "High",
  "risk_score": <integer 1-100>,
  "risk_color": "#22c55e" | "#f59e0b" | "#ef4444",
  "key_parties": [
    {{"role": "Party role", "name": "Name or description"}}
  ],
  "clauses": [
    {{
      "title": "Clause title",
      "original": "Brief quote or paraphrase of the original legal text",
      "explanation": "Plain English explanation of what this clause means",
      "risk_level": "Low" | "Medium" | "High",
      "risk_reason": "Why this clause carries risk (or why it doesn't)",
      "recommendation": "What the signer should do or watch out for"
    }}
  ],
  "financial_snapshot": {{
    "currency_note": "Currency used in the document",
    "items": [
      {{"label": "Item name", "amount": "Amount with currency", "frequency": "One-time / Monthly / Annual / etc.", "note": "Any important note"}}
    ]
  }},
  "deadlines": [
    {{
      "event": "Description of the deadline or important date",
      "date_info": "Specific date or relative timing (e.g., '30 days after signing')",
      "consequence": "What happens if missed",
      "urgency": "Low" | "Medium" | "High"
    }}
  ],
  "suspicious_clauses": [
    {{
      "type": "Type of suspicious clause (e.g., 'Automatic Renewal', 'Unlimited Liability')",
      "description": "Plain English description of why this is suspicious",
      "risk_level": "Medium" | "High",
      "recommendation": "What to do about it"
    }}
  ],
  "risk_flags": [
    {{
      "flag": "Short flag title",
      "detail": "Detailed explanation",
      "severity": "Low" | "Medium" | "High"
    }}
  ],
  "questions_to_ask": [
    "Question you should ask before signing"
  ]
}}

Analyze AT LEAST 5 clauses. For suspicious clauses, specifically look for:
- Automatic renewal / rollover clauses
- Unlimited or uncapped liability
- Unilateral modification rights (one party can change terms)
- Broad indemnification clauses
- Mandatory arbitration (waiver of court rights)
- Non-compete or non-solicitation clauses
- Data sharing or privacy-invasive terms
- Extremely short notice periods
- Asymmetric termination rights
- Penalty clauses with harsh consequences

If financial amounts are mentioned in Indian Rupees, keep them in ₹. If USD, use $."""

        try:
            raw = self._call_groq(system_prompt, analysis_prompt, model=self.large_model, max_tokens=6000)
            result = self._extract_json(raw)

            if not result:
                logger.warning("Empty JSON from analysis, using fallback")
                result = self._fallback_analysis(doc_type)

            # Ensure required fields exist with defaults
            result.setdefault("summary", "Analysis completed. Please review the clauses below.")
            result.setdefault("overall_risk", "Medium")
            result.setdefault("risk_score", 50)
            result.setdefault("risk_color", "#f59e0b")
            result.setdefault("key_parties", [])
            result.setdefault("clauses", [])
            result.setdefault("financial_snapshot", {"currency_note": "", "items": []})
            result.setdefault("deadlines", [])
            result.setdefault("suspicious_clauses", [])
            result.setdefault("risk_flags", [])
            result.setdefault("questions_to_ask", [])

            # Ensure risk_color matches overall_risk
            if result["overall_risk"] == "High":
                result["risk_color"] = "#ef4444"
            elif result["overall_risk"] == "Low":
                result["risk_color"] = "#22c55e"
            else:
                result["risk_color"] = "#f59e0b"

            return result

        except Exception as e:
            logger.exception(f"Analysis error: {e}")
            raise

    def _fallback_analysis(self, doc_type: str) -> dict:
        """Minimal fallback if LLM fails."""
        return {
            "summary": f"This appears to be a {doc_type}. Full automated analysis could not be completed. Please review the document manually with a legal professional.",
            "overall_risk": "Medium",
            "risk_score": 50,
            "risk_color": "#f59e0b",
            "key_parties": [],
            "clauses": [],
            "financial_snapshot": {"currency_note": "", "items": []},
            "deadlines": [],
            "suspicious_clauses": [],
            "risk_flags": [{"flag": "Manual review required", "detail": "Automated analysis incomplete", "severity": "Medium"}],
            "questions_to_ask": ["Please consult a legal professional for a thorough review."]
        }
