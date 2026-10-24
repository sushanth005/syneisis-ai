"""
Report Generator Service
Generates a PDF review report for download using ReportLab (pure Python, no wkhtmltopdf needed).
"""

import os
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate downloadable PDF review reports."""

    def generate_pdf(self, session_id: str, result: dict) -> str:
        """Generate a PDF report and return its file path."""
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.platypus import (
                SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                HRFlowable, KeepTogether
            )
            from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

            reports_dir = Path("reports")
            reports_dir.mkdir(exist_ok=True)
            report_path = reports_dir / f"legal_review_{session_id[:8]}.pdf"

            doc = SimpleDocTemplate(
                str(report_path),
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm,
            )

            styles = getSampleStyleSheet()

            # Custom styles
            title_style = ParagraphStyle(
                "CustomTitle",
                parent=styles["Title"],
                fontSize=22,
                textColor=colors.HexColor("#1e293b"),
                spaceAfter=6,
                fontName="Helvetica-Bold",
            )
            heading1 = ParagraphStyle(
                "Heading1Custom",
                parent=styles["Heading1"],
                fontSize=14,
                textColor=colors.HexColor("#1e3a8a"),
                spaceBefore=12,
                spaceAfter=4,
                fontName="Helvetica-Bold",
            )
            heading2 = ParagraphStyle(
                "Heading2Custom",
                parent=styles["Heading2"],
                fontSize=11,
                textColor=colors.HexColor("#334155"),
                spaceBefore=8,
                spaceAfter=2,
                fontName="Helvetica-Bold",
            )
            body_style = ParagraphStyle(
                "BodyCustom",
                parent=styles["Normal"],
                fontSize=9,
                leading=14,
                textColor=colors.HexColor("#334155"),
                spaceAfter=4,
                alignment=TA_JUSTIFY,
            )
            disclaimer_style = ParagraphStyle(
                "Disclaimer",
                parent=styles["Normal"],
                fontSize=8,
                textColor=colors.HexColor("#dc2626"),
                leading=12,
                alignment=TA_CENTER,
            )

            # Risk color helper
            def risk_color(level: str):
                return {
                    "High": colors.HexColor("#ef4444"),
                    "Medium": colors.HexColor("#f59e0b"),
                    "Low": colors.HexColor("#22c55e"),
                }.get(level, colors.HexColor("#6b7280"))

            story = []

            # ── Header ──
            story.append(Paragraph("AI Legal Document Review Report", title_style))
            story.append(Paragraph(
                f"<font size='9' color='#64748b'>Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} &nbsp;|&nbsp; "
                f"Document: {result.get('filename', 'Unknown')} &nbsp;|&nbsp; "
                f"Type: {result.get('doc_type', 'Unknown')}</font>",
                styles["Normal"]
            ))
            story.append(Spacer(1, 0.3*cm))

            # Disclaimer banner
            disclaimer_data = [
                [Paragraph(
                    "⚠️ DISCLAIMER: This report is AI-generated for informational purposes only. "
                    "It does NOT constitute legal advice. Consult a qualified legal professional before signing.",
                    disclaimer_style
                )]
            ]
            disclaimer_table = Table(disclaimer_data, colWidths=[16.5*cm])
            disclaimer_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#dc2626")),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(disclaimer_table)
            story.append(Spacer(1, 0.4*cm))

            # ── Overall Risk ──
            risk = result.get("overall_risk", "Unknown")
            score = result.get("risk_score", 0)
            r_color = risk_color(risk)

            risk_data = [
                [
                    Paragraph(f"<b>Overall Risk Level</b>", heading1),
                    Paragraph(f"<b>Risk Score</b>", heading1),
                ],
                [
                    Paragraph(f"<font size='24'><b>{risk.upper()}</b></font>", styles["Normal"]),
                    Paragraph(f"<font size='24'><b>{score}/100</b></font>", styles["Normal"]),
                ]
            ]
            risk_table = Table(risk_data, colWidths=[8.25*cm, 8.25*cm])
            risk_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 2, r_color),
                ("TEXTCOLOR", (0, 1), (-1, 1), r_color),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("PADDING", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            story.append(risk_table)
            story.append(Spacer(1, 0.4*cm))

            # ── Summary ──
            story.append(Paragraph("Document Summary", heading1))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3b82f6")))
            story.append(Spacer(1, 0.2*cm))
            summary = result.get("summary", "No summary available.")
            for para in summary.split("\n"):
                if para.strip():
                    story.append(Paragraph(para.strip(), body_style))

            story.append(Spacer(1, 0.4*cm))

            # ── Financial Snapshot ──
            financial = result.get("financial_snapshot", {})
            fin_items = financial.get("items", [])
            if fin_items:
                story.append(Paragraph("Financial Snapshot", heading1))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3b82f6")))
                story.append(Spacer(1, 0.2*cm))

                fin_data = [["Item", "Amount", "Frequency", "Notes"]]
                for item in fin_items:
                    fin_data.append([
                        Paragraph(item.get("label", ""), body_style),
                        Paragraph(f"<b>{item.get('amount', '')}</b>", body_style),
                        Paragraph(item.get("frequency", ""), body_style),
                        Paragraph(item.get("note", ""), body_style),
                    ])

                fin_table = Table(fin_data, colWidths=[4.5*cm, 3.5*cm, 3.5*cm, 5*cm])
                fin_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                story.append(fin_table)
                story.append(Spacer(1, 0.4*cm))

            # ── Suspicious Clauses ──
            suspicious = result.get("suspicious_clauses", [])
            if suspicious:
                story.append(Paragraph("⚠️ Suspicious Clauses Detected", heading1))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#ef4444")))
                story.append(Spacer(1, 0.2*cm))

                for clause in suspicious:
                    clause_level = clause.get("risk_level", "Medium")
                    c_color = risk_color(clause_level)
                    block = [
                        [
                            Paragraph(f"<b>{clause.get('type', 'Unknown')}</b>", heading2),
                            Paragraph(f"<b>{clause_level}</b>", ParagraphStyle(
                                "RiskBadge", parent=styles["Normal"],
                                textColor=c_color, fontSize=9, fontName="Helvetica-Bold"
                            )),
                        ],
                        [Paragraph(clause.get("description", ""), body_style), ""],
                        [Paragraph(f"<b>Recommendation:</b> {clause.get('recommendation', '')}", body_style), ""],
                    ]
                    t = Table(block, colWidths=[14*cm, 2.5*cm])
                    t.setStyle(TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff7ed")),
                        ("BOX", (0, 0), (-1, -1), 1, c_color),
                        ("PADDING", (0, 0), (-1, -1), 6),
                        ("SPAN", (0, 1), (-1, 1)),
                        ("SPAN", (0, 2), (-1, 2)),
                    ]))
                    story.append(KeepTogether([t, Spacer(1, 0.2*cm)]))

            story.append(Spacer(1, 0.2*cm))

            # ── Key Clauses ──
            clauses = result.get("clauses", [])
            if clauses:
                story.append(Paragraph("Clause-by-Clause Analysis", heading1))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3b82f6")))
                story.append(Spacer(1, 0.2*cm))

                for i, clause in enumerate(clauses, 1):
                    cl = clause.get("risk_level", "Low")
                    c_color = risk_color(cl)
                    clause_block = [
                        Paragraph(f"<b>{i}. {clause.get('title', 'Clause')}</b>  [{cl} Risk]", heading2),
                        Paragraph(f"<i>{clause.get('original', '')[:200]}</i>", ParagraphStyle(
                            "Original", parent=styles["Normal"],
                            fontSize=8, textColor=colors.HexColor("#64748b"), leading=11
                        )),
                        Paragraph(f"<b>Plain English:</b> {clause.get('explanation', '')}", body_style),
                        Paragraph(f"<b>Risk Reason:</b> {clause.get('risk_reason', '')}", body_style),
                        Paragraph(f"<b>✔ Recommendation:</b> {clause.get('recommendation', '')}", body_style),
                        Spacer(1, 0.2*cm),
                    ]
                    story.extend(clause_block)

            # ── Deadlines ──
            deadlines = result.get("deadlines", [])
            if deadlines:
                story.append(Paragraph("Important Deadlines & Dates", heading1))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3b82f6")))
                story.append(Spacer(1, 0.2*cm))

                dl_data = [["Event", "Timing", "If Missed", "Urgency"]]
                for dl in deadlines:
                    dl_data.append([
                        Paragraph(dl.get("event", ""), body_style),
                        Paragraph(dl.get("date_info", ""), body_style),
                        Paragraph(dl.get("consequence", ""), body_style),
                        Paragraph(dl.get("urgency", ""), body_style),
                    ])

                dl_table = Table(dl_data, colWidths=[4.5*cm, 3.5*cm, 5*cm, 3*cm])
                dl_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                story.append(dl_table)
                story.append(Spacer(1, 0.4*cm))

            # ── Questions to Ask ──
            questions = result.get("questions_to_ask", [])
            if questions:
                story.append(Paragraph("Questions to Ask Before Signing", heading1))
                story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3b82f6")))
                story.append(Spacer(1, 0.2*cm))
                for i, q in enumerate(questions, 1):
                    story.append(Paragraph(f"{i}. {q}", body_style))

            story.append(Spacer(1, 0.5*cm))

            # ── Footer disclaimer ──
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
            story.append(Spacer(1, 0.2*cm))
            story.append(Paragraph(
                "This report was generated by AI Legal Document Simplifier & Risk Analyzer (Team-2, CSE-Q, 3rd B.Tech). "
                "It is NOT legal advice. Always consult a qualified attorney for professional legal guidance.",
                disclaimer_style
            ))

            doc.build(story)
            logger.info(f"PDF report generated: {report_path}")
            return str(report_path)

        except ImportError:
            logger.warning("ReportLab not installed. Installing and retrying...")
            os.system("pip install reportlab")
            return self.generate_pdf(session_id, result)
        except Exception as e:
            logger.exception(f"PDF generation error: {e}")
            raise RuntimeError(f"Could not generate PDF report: {str(e)}")
