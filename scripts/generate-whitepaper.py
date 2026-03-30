"""
Generate Servicialo Protocol v0.9 Whitepaper PDF
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ─── Colors ──────────────────────────────────────────────────────────────────
INK       = colors.HexColor("#0F172A")   # near-black
MUTED     = colors.HexColor("#475569")   # slate-600
ACCENT    = colors.HexColor("#6366F1")   # indigo-500
ACCENT_LT = colors.HexColor("#EEF2FF")   # indigo-50
RULE      = colors.HexColor("#E2E8F0")   # slate-200
CODE_BG   = colors.HexColor("#F8FAFC")   # slate-50
CODE_BD   = colors.HexColor("#CBD5E1")   # slate-300
TABLE_HD  = colors.HexColor("#1E293B")   # slate-800
TABLE_ALT = colors.HexColor("#F8FAFC")   # slate-50
WHITE     = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 2.2 * cm

# ─── Styles ───────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()

    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        "cover_title": S("cover_title",
            fontName="Helvetica-Bold", fontSize=32, leading=40,
            textColor=WHITE, alignment=TA_LEFT, spaceAfter=8),

        "cover_sub": S("cover_sub",
            fontName="Helvetica", fontSize=15, leading=22,
            textColor=colors.HexColor("#C7D2FE"), alignment=TA_LEFT, spaceAfter=24),

        "cover_meta": S("cover_meta",
            fontName="Helvetica", fontSize=9, leading=14,
            textColor=colors.HexColor("#A5B4FC"), alignment=TA_LEFT),

        "cover_abstract_head": S("cover_abstract_head",
            fontName="Helvetica-Bold", fontSize=10, leading=14,
            textColor=colors.HexColor("#C7D2FE"), spaceAfter=4),

        "cover_abstract": S("cover_abstract",
            fontName="Helvetica", fontSize=9.5, leading=15,
            textColor=colors.HexColor("#E0E7FF"), alignment=TA_JUSTIFY),

        "h1": S("h1",
            fontName="Helvetica-Bold", fontSize=18, leading=24,
            textColor=INK, spaceBefore=28, spaceAfter=10),

        "h2": S("h2",
            fontName="Helvetica-Bold", fontSize=13, leading=18,
            textColor=INK, spaceBefore=18, spaceAfter=6),

        "h3": S("h3",
            fontName="Helvetica-Bold", fontSize=11, leading=15,
            textColor=MUTED, spaceBefore=12, spaceAfter=4),

        "body": S("body",
            fontName="Helvetica", fontSize=10, leading=16,
            textColor=INK, alignment=TA_JUSTIFY, spaceAfter=8),

        "body_muted": S("body_muted",
            fontName="Helvetica", fontSize=9.5, leading=15,
            textColor=MUTED, alignment=TA_JUSTIFY, spaceAfter=6),

        "code": S("code",
            fontName="Courier", fontSize=8.2, leading=12.5,
            textColor=colors.HexColor("#1E293B"),
            backColor=CODE_BG, spaceAfter=2,
            leftIndent=0, rightIndent=0),

        "bullet": S("bullet",
            fontName="Helvetica", fontSize=10, leading=15,
            textColor=INK, leftIndent=16, spaceAfter=3,
            bulletIndent=4),

        "toc_h1": S("toc_h1",
            fontName="Helvetica-Bold", fontSize=10, leading=16,
            textColor=INK, spaceAfter=2),

        "toc_h2": S("toc_h2",
            fontName="Helvetica", fontSize=9.5, leading=15,
            textColor=MUTED, leftIndent=14, spaceAfter=1),

        "caption": S("caption",
            fontName="Helvetica-Oblique", fontSize=8.5, leading=12,
            textColor=MUTED, alignment=TA_CENTER, spaceAfter=6),

        "section_num": S("section_num",
            fontName="Helvetica", fontSize=10, leading=14,
            textColor=ACCENT, spaceAfter=0),

        "tag_pill": S("tag_pill",
            fontName="Helvetica-Bold", fontSize=7.5, leading=10,
            textColor=WHITE),
    }


# ─── Helper Flowables ─────────────────────────────────────────────────────────
class Rule(Flowable):
    def __init__(self, width=None, color=RULE, thickness=0.6):
        super().__init__()
        self.width = width
        self.color = color
        self.thickness = thickness
        self.height = thickness + 4

    def draw(self):
        w = self.width or self._frame._aW
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.thickness / 2, w, self.thickness / 2)


class AccentRule(Flowable):
    """A two-tone horizontal rule (accent left, light right)."""
    def __init__(self, accent_frac=0.08):
        super().__init__()
        self.accent_frac = accent_frac
        self.height = 3

    def draw(self):
        w = self._frame._aW
        self.canv.setFillColor(ACCENT)
        self.canv.rect(0, 0, w * self.accent_frac, 3, stroke=0, fill=1)
        self.canv.setFillColor(RULE)
        self.canv.rect(w * self.accent_frac, 1, w * (1 - self.accent_frac), 1, stroke=0, fill=1)


class CodeBlock(Flowable):
    """Rendered code block with background, border, and monospace text."""
    def __init__(self, code_text, width=None):
        super().__init__()
        self.code_text = code_text
        self._width = width
        self.padding = 10
        self.font_size = 8
        self.line_height = 12

    def wrap(self, availWidth, availHeight):
        self.avail_width = availWidth
        lines = self.code_text.split('\n')
        self.height = len(lines) * self.line_height + self.padding * 2
        return availWidth, self.height

    def draw(self):
        w = self.avail_width
        h = self.height
        # Background
        self.canv.setFillColor(CODE_BG)
        self.canv.roundRect(0, 0, w, h, 4, stroke=0, fill=1)
        # Border
        self.canv.setStrokeColor(CODE_BD)
        self.canv.setLineWidth(0.5)
        self.canv.roundRect(0, 0, w, h, 4, stroke=1, fill=0)
        # Accent bar left
        self.canv.setFillColor(ACCENT)
        self.canv.rect(0, 0, 3, h, stroke=0, fill=1)
        # Text
        self.canv.setFillColor(INK)
        self.canv.setFont("Courier", self.font_size)
        lines = self.code_text.split('\n')
        y = h - self.padding - self.font_size
        for line in lines:
            self.canv.drawString(self.padding + 4, y, line)
            y -= self.line_height


class StatusBadge(Flowable):
    """Inline status badge (e.g. ✅ Production / 🔄 In progress)."""
    def __init__(self, text, bg=ACCENT, fg=WHITE):
        super().__init__()
        self.text = text
        self.bg = bg
        self.fg = fg
        self.height = 14
        self.width = len(text) * 5.5 + 12

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        self.canv.setFillColor(self.bg)
        self.canv.roundRect(0, 1, self.width, 12, 3, stroke=0, fill=1)
        self.canv.setFillColor(self.fg)
        self.canv.setFont("Helvetica-Bold", 7)
        self.canv.drawCentredString(self.width / 2, 4, self.text)


# ─── Page templates ───────────────────────────────────────────────────────────
def on_cover_page(canvas, doc):
    """Full-bleed dark cover page."""
    w, h = A4
    # Background gradient simulation (two rects)
    canvas.setFillColor(colors.HexColor("#0F172A"))
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#1E1B4B"))
    canvas.rect(0, h * 0.55, w, h * 0.45, stroke=0, fill=1)
    # Subtle grid lines
    canvas.setStrokeColor(colors.HexColor("#1E293B"))
    canvas.setLineWidth(0.4)
    for x in range(0, int(w), 28):
        canvas.line(x, 0, x, h)
    for y in range(0, int(h), 28):
        canvas.line(0, y, w, y)
    # Accent bar top
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h - 4, w, 4, stroke=0, fill=1)
    # Footer bar
    canvas.setFillColor(colors.HexColor("#1E1B4B"))
    canvas.rect(0, 0, w, 22, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#6366F1"))
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN, 8, "servicialo.com  ·  Apache 2.0  ·  Open Standard")
    canvas.setFillColor(colors.HexColor("#818CF8"))
    canvas.drawRightString(w - MARGIN, 8, "v0.9  ·  March 2026")


def on_normal_page(canvas, doc):
    """Header + footer for body pages."""
    w, h = A4
    # Header line
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, h - MARGIN + 6, w - MARGIN, h - MARGIN + 6)
    # Header text
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN, h - MARGIN + 9, "Servicialo Protocol  ·  v0.9  ·  March 2026")
    canvas.drawRightString(w - MARGIN, h - MARGIN + 9, "Open Standard for Agentic Service Orchestration")
    # Footer line
    canvas.line(MARGIN, MARGIN - 6, w - MARGIN, MARGIN - 6)
    canvas.drawCentredString(w / 2, MARGIN - 14, str(doc.page))
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#CBD5E1"))
    canvas.drawString(MARGIN, MARGIN - 14, "servicialo.com")
    canvas.drawRightString(w - MARGIN, MARGIN - 14, "Apache 2.0")


# ─── Table builder helper ─────────────────────────────────────────────────────
def make_table(data, col_widths=None, header=True):
    avail = PAGE_W - 2 * MARGIN
    if col_widths is None:
        n = len(data[0])
        col_widths = [avail / n] * n

    style = [
        ("FONTNAME",    (0, 0), (-1, 0 if header else -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 8.5),
        ("LEADING",     (0, 0), (-1, -1), 13),
        ("TEXTCOLOR",   (0, 0), (-1, 0), WHITE),
        ("BACKGROUND",  (0, 0), (-1, 0), TABLE_HD),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, TABLE_ALT]),
        ("GRID",        (0, 0), (-1, -1), 0.3, RULE),
        ("LINEBELOW",   (0, 0), (-1, 0), 0.8, ACCENT),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",(0, 0), (-1, -1), 7),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
    ]
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    t.setStyle(TableStyle(style))
    return t


# ─── Content builders ─────────────────────────────────────────────────────────
def cover_page(S):
    avail = PAGE_W - 2 * MARGIN
    elems = []

    # Spacer to push content down from top (cover bg is drawn by onPage)
    elems.append(Spacer(1, 5.5 * cm))

    # Protocol badge
    badge_data = [["OPEN PROTOCOL  ·  APACHE 2.0  ·  RELEASE CANDIDATE"]]
    badge = Table(badge_data, colWidths=[avail])
    badge.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), colors.HexColor("#312E81")),
        ("TEXTCOLOR",    (0,0), (-1,-1), colors.HexColor("#A5B4FC")),
        ("FONTNAME",     (0,0), (-1,-1), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 7.5),
        ("LEADING",      (0,0), (-1,-1), 11),
        ("TOPPADDING",   (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 6),
        ("LEFTPADDING",  (0,0), (-1,-1), 10),
        ("ALIGN",        (0,0), (-1,-1), "LEFT"),
    ]))
    elems.append(badge)
    elems.append(Spacer(1, 18))

    elems.append(Paragraph("Servicialo Protocol", S["cover_title"]))
    elems.append(Paragraph("v0.9", ParagraphStyle("v", fontName="Helvetica-Bold",
        fontSize=42, leading=50, textColor=ACCENT, spaceAfter=4)))
    elems.append(Paragraph("An Open Standard for Agentic Service Orchestration",
        S["cover_sub"]))

    elems.append(Spacer(1, 10))
    rule_data = [["",""]]
    rt = Table(rule_data, colWidths=[avail * 0.07, avail * 0.93])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(0,0), ACCENT),
        ("BACKGROUND", (1,0),(1,0), colors.HexColor("#312E81")),
        ("LINEABOVE",  (0,0),(-1,-1), 0, colors.transparent),
        ("TOPPADDING", (0,0),(-1,-1), 1),
        ("BOTTOMPADDING",(0,0),(-1,-1), 1),
    ]))
    elems.append(rt)
    elems.append(Spacer(1, 28))

    # Meta info grid
    meta = [
        ["Version", "0.9", "Status", "Release Candidate"],
        ["Date", "March 2026", "License", "Apache 2.0"],
        ["Registry", "servicialo.com/.well-known/agents.json", "MCP Package", "@servicialo/mcp-server"],
        ["Reference impl.", "Coordinalo (coordinalo.com)", "Tools", "35 MCP tools"],
    ]
    mt = Table(meta, colWidths=[avail*0.14, avail*0.36, avail*0.14, avail*0.36])
    mt.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",     (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTNAME",     (1,0), (1,-1), "Helvetica"),
        ("FONTNAME",     (3,0), (3,-1), "Helvetica"),
        ("FONTSIZE",     (0,0), (-1,-1), 8.5),
        ("LEADING",      (0,0), (-1,-1), 13),
        ("TEXTCOLOR",    (0,0), (0,-1), colors.HexColor("#A5B4FC")),
        ("TEXTCOLOR",    (2,0), (2,-1), colors.HexColor("#A5B4FC")),
        ("TEXTCOLOR",    (1,0), (1,-1), WHITE),
        ("TEXTCOLOR",    (3,0), (3,-1), WHITE),
        ("TOPPADDING",   (0,0), (-1,-1), 4),
        ("BOTTOMPADDING",(0,0), (-1,-1), 4),
        ("LINEBELOW",    (0,0), (-1,-2), 0.3, colors.HexColor("#1E3A5F")),
    ]))
    elems.append(mt)
    elems.append(Spacer(1, 32))

    # Abstract
    elems.append(Paragraph("ABSTRACT", S["cover_abstract_head"]))
    abstract = (
        "Servicialo is an open protocol that enables AI agents to discover, negotiate, "
        "and fulfill real-world service interactions — across scheduling, billing, clinical "
        "management, and inter-organizational referrals — without human intermediation. "
        "Version 0.9 introduces three foundational advances: a 3-Tier Access Model that "
        "distinguishes public, authenticated, and restricted capabilities; a Delegated "
        "Agency Model that allows agents to act with verifiable, scoped mandates on behalf "
        "of humans and organizations; and A2A v0.3 interoperability for composition with "
        "any A2A-capable system. The protocol is implemented in production by Coordinalo, "
        "the reference implementation. As of v0.9, the tool catalog has grown to 35 MCP "
        "tools and the protocol addresses financial inclusion as a design constraint."
    )
    elems.append(Paragraph(abstract, S["cover_abstract"]))

    elems.append(PageBreak())
    return elems


def toc(S):
    avail = PAGE_W - 2 * MARGIN
    elems = []
    elems.append(Paragraph("Table of Contents", S["h1"]))
    elems.append(AccentRule())
    elems.append(Spacer(1, 12))

    sections = [
        ("1.", "The Problem", []),
        ("2.", "Protocol Overview", [
            ("2.1", "Protocol Version History"),
        ]),
        ("3.", "Core Principles", []),
        ("4.", "3-Tier Access Model", [
            ("4.0", "Tier 0 — Public (10 tools)"),
            ("4.1", "Tier 1 — Authenticated (15 tools)"),
            ("4.2", "Tier 2 — Delegated (10 tools)"),
        ]),
        ("5.", "DNS Resolution System", [
            ("5.1", "Resolution Chain"),
            ("5.2", "6 Resolver Tools"),
            ("5.3", "The x-servicialo Extension"),
        ]),
        ("6.", "Delegated Agency Model", [
            ("6.1", "ServiceMandate"),
            ("6.2", "Mandate Lifecycle"),
        ]),
        ("7.", "A2A v0.3 Interoperability", [
            ("7.1", "Key Changes from v0.2"),
            ("7.2", "Booking Flow Example"),
        ]),
        ("8.", "Genesis Agent Skills", []),
        ("9.", "Financial Inclusion", []),
        ("10.", "Reference Implementation: Coordinalo", []),
        ("11.", "Ecosystem and Registry", []),
        ("12.", "Roadmap", []),
        ("13.", "Exceptions and Scope Boundaries", []),
        ("14.", "Conclusion", []),
        ("App. A", "Full Tool Catalog", []),
        ("App. B", "Comparison with Prior Versions", []),
    ]

    for num, title, subs in sections:
        row_data = [[
            Paragraph(f"<b>{num}</b>", ParagraphStyle("tn", fontName="Helvetica-Bold",
                fontSize=9.5, textColor=ACCENT, leading=14)),
            Paragraph(title, ParagraphStyle("tt", fontName="Helvetica-Bold",
                fontSize=10, textColor=INK, leading=14)),
        ]]
        rt = Table(row_data, colWidths=[avail*0.08, avail*0.92])
        rt.setStyle(TableStyle([
            ("TOPPADDING",   (0,0),(-1,-1), 3),
            ("BOTTOMPADDING",(0,0),(-1,-1), 3),
            ("LINEBELOW",    (0,0),(-1,-1), 0.3, RULE),
        ]))
        elems.append(rt)
        for snum, stitle in subs:
            sub_data = [[
                Paragraph(snum, ParagraphStyle("sn", fontName="Helvetica",
                    fontSize=8.5, textColor=MUTED, leading=13)),
                Paragraph(stitle, ParagraphStyle("st", fontName="Helvetica",
                    fontSize=9, textColor=MUTED, leading=13)),
            ]]
            sr = Table(sub_data, colWidths=[avail*0.10, avail*0.90])
            sr.setStyle(TableStyle([
                ("TOPPADDING",   (0,0),(-1,-1), 1),
                ("BOTTOMPADDING",(0,0),(-1,-1), 2),
                ("LEFTPADDING",  (0,0),(-1,-1), 18),
            ]))
            elems.append(sr)

    elems.append(PageBreak())
    return elems


def section_header(S, number, title):
    """Returns a visually distinct section header block."""
    avail = PAGE_W - 2 * MARGIN
    data = [[
        Paragraph(f"<b>{number}</b>", ParagraphStyle("sn2", fontName="Helvetica-Bold",
            fontSize=11, textColor=WHITE, leading=14)),
        Paragraph(f"<b>{title}</b>", ParagraphStyle("st2", fontName="Helvetica-Bold",
            fontSize=16, textColor=WHITE, leading=20)),
    ]]
    t = Table(data, colWidths=[avail*0.08, avail*0.92])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), TABLE_HD),
        ("TOPPADDING",   (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0), (-1,-1), 10),
        ("LEFTPADDING",  (0,0), (0, 0), 10),
        ("LEFTPADDING",  (1,0), (1, 0), 6),
        ("LINEBELOW",    (0,0), (-1,-1), 2, ACCENT),
    ]))
    return [Spacer(1, 8), t, Spacer(1, 12)]


def body_content(S):
    avail = PAGE_W - 2 * MARGIN
    elems = []

    # ── Section 1 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "1", "The Problem")

    elems.append(Paragraph(
        "Service delivery — in healthcare, professional consulting, home services, "
        "education — is fragmented at the infrastructure layer. Each clinic, agency, "
        "and practice runs its own scheduling system. Each billing platform speaks its "
        "own language. Referrals between organizations rely on phone calls, WhatsApp "
        "messages, and manual re-entry.", S["body"]))

    elems.append(Paragraph(
        "The emergence of AI agents capable of autonomous action has exposed this "
        "fragmentation as a systemic failure. An agent that can draft an email, query "
        "a database, and call an API cannot book a physical therapy appointment, check "
        "a patient's ISAPRE reimbursement status, or route a referral to a specialist "
        "— because there is no standard protocol for agents to interact with service "
        "providers.", S["body"]))

    elems.append(Paragraph(
        "<b>The gap is not AI capability. It is the absence of a service interoperability layer.</b>",
        ParagraphStyle("emph", fontName="Helvetica-Bold", fontSize=10.5, leading=16,
            textColor=ACCENT, spaceAfter=10, spaceBefore=4)))

    elems.append(Paragraph("Existing protocols partially address adjacent problems:", S["body"]))

    gap_data = [
        ["Protocol", "What it solves", "What it misses"],
        ["MCP (Anthropic)", "Tool invocation from AI agents", "Service-domain semantics, consent, billing"],
        ["A2A (Google)", "Agent-to-agent task delegation", "Service discovery, financial flows, patient data"],
        ["CalDAV / iCal", "Calendar interoperability", "Agent-native access, authentication, clinical context"],
        ["HL7 / FHIR", "Clinical data exchange", "Scheduling, billing, agent interoperability"],
    ]
    elems.append(make_table(gap_data, [avail*0.18, avail*0.36, avail*0.46]))
    elems.append(Spacer(1, 6))
    elems.append(Paragraph(
        "Servicialo fills the gap between AI agent infrastructure (MCP, A2A) and "
        "real-world service execution.", S["body"]))

    # ── Section 2 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "2", "Protocol Overview")

    elems.append(Paragraph("Servicialo defines:", S["body"]))
    bullets = [
        "A <b>discovery layer</b> — how agents find service organizations and their capabilities",
        "A <b>tool catalog</b> — 35 standardized MCP tools that any compliant implementation exposes",
        "An <b>access model</b> — three tiers governing what agents can do without, with, and beyond authentication",
        "A <b>delegation model</b> — how humans grant agents scoped mandates to act on their behalf",
        "An <b>interoperability layer</b> — A2A v0.3 integration for multi-agent orchestration",
        "A <b>financial model</b> — how payments, reimbursements, and financial inclusion are handled",
    ]
    for b in bullets:
        elems.append(Paragraph(f"• {b}", S["bullet"]))
    elems.append(Spacer(1, 8))

    elems.append(Paragraph("2.1  Protocol Version History", S["h2"]))
    vh_data = [
        ["Version", "Key Addition"],
        ["0.1", "Core booking intent schema"],
        ["0.2", "MCP tool catalog (20 tools), basic A2A"],
        ["0.6", "DNS Resolution, whitepaper published"],
        ["0.8", "ServiceMandate draft, financial flows"],
        ["0.9  ★", "3-Tier Access, Delegated Agency, A2A v0.3, 35 tools, financial inclusion"],
    ]
    elems.append(make_table(vh_data, [avail*0.15, avail*0.85]))

    # ── Section 3 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "3", "Core Principles")

    principles = [
        ("1", "Interoperability by Default",
         "Any compliant agent should interact with any compliant service organization "
         "without bilateral integration agreements. The protocol is the contract."),
        ("2", "Human Authority, Agent Execution",
         "Agents act; humans authorize. No agentic action affecting health, finances, "
         "or legal status may proceed without a traceable human mandate. The Delegated "
         "Agency Model (§6) formalizes this principle."),
        ("3", "Progressive Disclosure",
         "Public capabilities are discoverable without authentication. Sensitive "
         "operations require progressively stronger authorization. The 3-Tier Access "
         "Model (§4) implements this principle."),
        ("4", "Auditability",
         "Every consequential action — booking, payment, clinical note, referral — "
         "must produce an auditable record. Tools are designed to emit structured "
         "audit events, not just return success/failure."),
        ("5", "Financial Sovereignty",
         "The protocol does not prescribe a payment provider. Organizations may accept "
         "bank transfers, card payments, FONASA vouchers, or any other mechanism. "
         "Financial flows are first-class protocol citizens."),
        ("6", "Clinical Privacy as Default",
         "When handling clinical data, the most restrictive privacy posture must be the "
         "default. Agents do not receive clinical information they have not been "
         "explicitly granted access to, regardless of authentication level."),
        ("7", "Collective Intelligence as Common Good",
         "Service interactions generate aggregate intelligence. Implementations that "
         "participate in the registry contribute anonymized aggregate signals to the "
         "commons. No individual patient data. The intelligence is collective; "
         "the privacy is absolute."),
    ]

    for num, title, desc in principles:
        p_data = [[
            Paragraph(f"<b>{num}</b>", ParagraphStyle("pn", fontName="Helvetica-Bold",
                fontSize=13, textColor=ACCENT, leading=16)),
            [Paragraph(f"<b>{title}</b>", ParagraphStyle("pt", fontName="Helvetica-Bold",
                fontSize=10, textColor=INK, leading=14, spaceAfter=2)),
             Paragraph(desc, S["body_muted"])],
        ]]
        pt = Table(p_data, colWidths=[avail*0.06, avail*0.94])
        pt.setStyle(TableStyle([
            ("VALIGN",       (0,0),(-1,-1), "TOP"),
            ("TOPPADDING",   (0,0),(-1,-1), 6),
            ("BOTTOMPADDING",(0,0),(-1,-1), 4),
            ("LINEBELOW",    (0,0),(-1,-1), 0.3, RULE),
        ]))
        elems.append(pt)
    elems.append(Spacer(1, 4))

    # ── Section 4 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "4", "3-Tier Access Model")

    elems.append(Paragraph(
        "Prior versions of Servicialo treated authentication as binary. Version 0.9 "
        "formalizes a three-tier model that maps cleanly onto real-world authorization patterns.",
        S["body"]))

    tiers = [
        ("Tier 0", "Public", "No credentials required", ACCENT,
         "10 public tools — any agent may invoke without credentials. Enables discovery, "
         "intent formation, and preliminary scheduling queries.",
         [["Tool", "Purpose"],
          ["resolve.lookup", "Resolve org slug to endpoints and trust level"],
          ["resolve.search", "Search registered organizations by country and vertical"],
          ["trust.get_score", "Get organization trust score (0-100)"],
          ["registry.search", "Search orgs by vertical, location, country"],
          ["registry.get_organization", "Get public organization details"],
          ["registry.manifest", "Get server manifest and available endpoints"],
          ["services.list", "List public service catalog for an organization"],
          ["scheduling.check_availability", "Query available slots (3-variable scheduler)"],
          ["a2a.get_agent_card", "Get A2A Agent Card for inter-agent discovery"],
          ["docs.quickstart", "Complete getting-started guide as structured data"]]),
        ("Tier 1", "Authenticated", "Standard API Key or OAuth", colors.HexColor("#0369A1"),
         "25 authenticated tools — require client-level authentication. Execute bookings, "
         "manage client records, and handle financial operations.",
         [["Tool (subset)", "Purpose"],
          ["scheduling.book", "Create a confirmed booking"],
          ["scheduling.confirm", "Confirm booked session"],
          ["scheduling.reschedule", "Move a booking to a new slot"],
          ["scheduling.cancel", "Cancel with reason and policy"],
          ["lifecycle.get_state", "Get current state + available transitions + history"],
          ["lifecycle.transition", "Execute state transition with evidence"],
          ["delivery.checkin / checkout", "Record arrival/departure with GPS + timestamp"],
          ["delivery.record_evidence", "Register delivery proof by vertical"],
          ["documentation.create", "Generate formal service record"],
          ["payments.create_sale / record_payment", "Financial settlement tools"],
          ["resource.list / get / create / update", "Physical resource management"],
          ["resolve.register / update_endpoint", "Org registration and portability"],
          ["clients.get_or_create", "Resolve or create client identity"],
          ["telemetry.heartbeat", "Send heartbeat to resolver"]]),
        ("Tier 2", "Delegated", "ServiceMandate required", colors.HexColor("#7C3AED"),
         "Tier 2 tools require a ServiceMandate object (§6) in addition to Tier 1 credentials. "
         "These execute on behalf of a human or organization with explicit, scoped, "
         "time-bounded authorization.",
         [["Tool", "Purpose"],
          ["servicialo_mandate_book", "Book using delegated authority"],
          ["servicialo_mandate_pay", "Execute payment with mandate"],
          ["servicialo_bulk_reschedule", "Reschedule multiple sessions"],
          ["servicialo_discharge_client", "Close active treatment plan"],
          ["servicialo_generate_prescription", "Create prescription record"],
          ["servicialo_export_clinical_record", "Export patient record (PDF)"],
          ["servicialo_create_consent_record", "Record signed informed consent"],
          ["servicialo_inter_org_transfer", "Transfer client to another org"],
          ["servicialo_audit_log", "Query full audit log"],
          ["servicialo_revoke_mandate", "Revoke active ServiceMandate"]]),
    ]

    for tier_id, tier_name, auth_req, color, desc, tool_rows in tiers:
        # Tier header
        th_data = [[Paragraph(f"<b>{tier_id} — {tier_name}</b>  |  {auth_req}",
            ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=10,
                textColor=WHITE, leading=14))]]
        tht = Table(th_data, colWidths=[avail])
        tht.setStyle(TableStyle([
            ("BACKGROUND", (0,0),(-1,-1), color),
            ("TOPPADDING", (0,0),(-1,-1), 8),
            ("BOTTOMPADDING",(0,0),(-1,-1), 8),
            ("LEFTPADDING",(0,0),(-1,-1), 12),
        ]))
        elems.append(Spacer(1, 10))
        elems.append(tht)
        elems.append(Paragraph(desc, ParagraphStyle("td", fontName="Helvetica",
            fontSize=9.5, leading=15, textColor=MUTED, spaceBefore=6, spaceAfter=6)))
        elems.append(make_table(tool_rows, None))
        elems.append(Spacer(1, 4))

    # ── Section 5 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "5", "DNS Resolution System")

    elems.append(Paragraph(
        "The Servicialo DNS Resolver provides a standardized discovery chain for agents "
        "to locate organizations, verify protocol compliance, and resolve endpoint "
        "topology — without prior knowledge or hardcoded URLs.", S["body"]))

    elems.append(Paragraph("Resolution Chain", S["h2"]))
    elems.append(CodeBlock(
"""Agent Query
    │
    ▼
Phase 0: Registry Lookup
    servicialo.com/.well-known/agents.json
    → Returns: [orgSlug, domain, protocolVersion, capabilities]
    │
    ▼
Phase 1: Agent Card Resolution
    {domain}/.well-known/agent.json
    → Returns: A2A card + x-servicialo extension + endpoints
    │
    ▼
Phase 2: Capability Negotiation
    MCP tool list query (Tier 0 — no auth)
    → Returns: Available tools, access tier requirements
    │
    ▼
Phase 3: Intent Submission
    Tool invocation with appropriate tier credentials"""))
    elems.append(Spacer(1, 10))

    elems.append(Paragraph("6 Resolver Tools", S["h2"]))
    res_data = [
        ["Tool", "Phase", "Purpose"],
        ["resolve.lookup", "0", "Lookup org by slug, returns endpoints + trust level"],
        ["resolve.search", "0", "Search registered orgs by country and vertical"],
        ["trust.get_score", "0", "Get org trust score — passive accumulation from delivery history"],
        ["registry.manifest", "1", "Get server manifest: capabilities, version, endpoints"],
        ["registry.get_organization", "1", "Get org details with services, providers, booking config"],
        ["resolve.register", "2", "Register new org in global resolver with unique portable slug"],
    ]
    elems.append(make_table(res_data, [avail*0.30, avail*0.10, avail*0.60]))
    elems.append(Spacer(1, 10))

    elems.append(Paragraph("The x-servicialo Extension", S["h2"]))
    elems.append(Paragraph(
        "Every Servicialo-compliant Agent Card must include the <b>x-servicialo</b> extension block. "
        "This gives any external agent — from Google ADK, Salesforce Agentforce, or any A2A-compatible "
        "system — everything it needs to initiate a service interaction in a single HTTP GET.",
        S["body"]))
    elems.append(CodeBlock(
""""x-servicialo": {
  "protocolVersion": "0.9",
  "implementer": {
    "name": "Coordinalo",
    "url": "https://coordinalo.com",
    "status": "verified",
    "type": "reference-implementation"
  },
  "endpoints": {
    "mcp": "https://servicialo.com/api/mcp",
    "rest": "https://servicialo.com/api/v1",
    "agentCard": "https://servicialo.com/.well-known/agent.json",
    "a2a": "https://servicialo.com/api/servicialo/{orgSlug}/a2a"
  },
  "registry": "https://servicialo.com/.well-known/agents.json"
}"""))

    # ── Section 6 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "6", "Delegated Agency Model")

    elems.append(Paragraph(
        "The Delegated Agency Model is the mechanism by which AI agents gain authority "
        "to act on behalf of a human or organization for a bounded set of operations.",
        S["body"]))

    elems.append(Paragraph("The Problem with Implicit Delegation", S["h2"]))
    elems.append(Paragraph(
        "Prior to v0.9, Servicialo conflated authentication with authorization. A valid "
        "API key meant an agent could do anything the key permitted. There was no way to "
        "express: \"this agent may book sessions for this patient, in this date range, "
        "for this service type, up to this cost.\"", S["body"]))

    elems.append(Paragraph("ServiceMandate", S["h2"]))
    elems.append(Paragraph(
        "A <b>ServiceMandate</b> is a signed, structured authorization object:", S["body"]))
    elems.append(CodeBlock(
"""{
  "mandateId": "mnd_01J...",
  "issuer": {
    "type": "human",
    "id": "client_xyz",
    "name": "María González"
  },
  "agent": {
    "id": "agent_abc",
    "name": "HealthBot Pro",
    "implementer": "acme-health-app"
  },
  "scope": {
    "tools": ["servicialo_mandate_book", "servicialo_reschedule"],
    "services": ["kinesiology"],
    "providers": ["any"],
    "maxCostPerSession": 50000,
    "currency": "CLP"
  },
  "validity": {
    "from": "2026-03-01T00:00:00Z",
    "until": "2026-06-01T00:00:00Z",
    "maxSessions": 12
  },
  "issuedAt": "2026-03-01T09:00:00Z",
  "signature": "sha256:..."
}"""))

    elems.append(Paragraph("Mandate Lifecycle", S["h2"]))
    elems.append(CodeBlock(
"""Human creates mandate (in app or via agent request)
    │
    ▼
Mandate stored in Servicialo-compliant org
    │
    ▼
Agent presents mandateId + Tier 1 credentials on each Tier 2 call
    │
    ▼
Org validates: scope, validity, remaining budget
    │
    ├── Valid   → execute + decrement mandate usage
    └── Invalid → reject + emit audit event
    │
    ▼
Human may revoke at any time via servicialo_revoke_mandate"""))

    elems.append(Spacer(1, 6))
    elems.append(Paragraph(
        "The Delegated Agency Model makes Servicialo-based agents legally and operationally "
        "trustworthy. A clinic can allow a health management platform to autonomously book "
        "follow-up sessions — bounded by explicit patient authorization, visible in the "
        "audit log, revocable at any time.", S["body"]))

    # ── Section 7 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "7", "A2A v0.3 Interoperability")

    elems.append(Paragraph(
        "Servicialo v0.9 adopts <b>A2A v0.3</b> as its multi-agent interoperability layer. "
        "A2A (Agent-to-Agent protocol, originated by Google, maintained by Linux Foundation) "
        "enables agents from different systems to exchange tasks, delegate subtasks, and share "
        "results through a standardized message format.", S["body"]))

    elems.append(Paragraph("Key Changes from A2A v0.2", S["h2"]))
    a2a_data = [
        ["Feature", "v0.2", "v0.3"],
        ["Task endpoint", "tasks/send", "message/send"],
        ["Part type field", "type", "kind"],
        ["Servicialo extension", "Not specified", "x-servicialo block required"],
        ["Protocol version", "Not declared", "protocol_version in all messages"],
    ]
    elems.append(make_table(a2a_data, [avail*0.35, avail*0.25, avail*0.40]))
    elems.append(Spacer(1, 10))

    elems.append(Paragraph("Booking Flow Example (A2A v0.3)", S["h2"]))
    elems.append(CodeBlock(
"""POST /api/a2a/message/send
{
  "protocol_version": "0.3",
  "message": {
    "role": "user",
    "parts": [
      {
        "kind": "text",
        "text": "Book a kinesiology session for María González next Tuesday afternoon"
      }
    ]
  },
  "context": {
    "orgSlug": "clinica-example",
    "mandateId": "mnd_01J..."
  }
}"""))

    elems.append(Paragraph("Cross-System Agent Composition", S["h2"]))
    elems.append(CodeBlock(
"""Google ADK Agent
    │ A2A v0.3 message/send
    ▼
Servicialo-compliant org (via x-servicialo agent card)
    │ Internal MCP tool invocation
    ▼
Booking confirmed → A2A response with task result
    │
    ▼
Google ADK receives structured confirmation"""))

    # ── Section 8 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "8", "Genesis Agent Skills")

    elems.append(Paragraph(
        "Genesis defines the five core agentic capabilities that a Servicialo-compliant "
        "agent must demonstrate to be considered production-ready. These are not API features "
        "— they are emergent behaviors arising from combining the protocol's tool set.",
        S["body"]))

    skills = [
        ("1", "Autonomous Discovery",
         "The agent locates a service organization, resolves its capabilities, and determines "
         "whether it can fulfill a need — without any hardcoded configuration.",
         "resolve.lookup → registry.get_organization → services.list → scheduling.check_availability",
         ""),
        ("2", "End-to-End Booking",
         "Completes a full booking cycle: availability query → slot selection → booking "
         "confirmation → payment recording — in a single autonomous session.",
         "scheduling.check_availability → scheduling.book → scheduling.confirm → payments.create_sale",
         "Production-verified (Coordinalo, March 2026)"),
        ("3", "Clinical Context Continuity",
         "Reads a patient's history, active treatment plan, and previous session notes "
         "before booking — and includes clinical context in the booking record.",
         "clients.get_or_create → lifecycle.get_state → documentation.create → scheduling.book",
         ""),
        ("4", "Inter-Organizational Referral",
         "Discovers a specialist organization, validates capacity, initiates a referral with "
         "consent token, and tracks the outcome — across two independent implementations.",
         "registry.search → servicialo_initiate_referral → servicialo_get_referral_status",
         ""),
        ("5", "Financial Reconciliation",
         "Identifies unmatched incoming payments, resolves the most probable client mapping "
         "using historical patterns, and marks payments as matched or flags for human review.",
         "payments.get_status → payments.record_payment → finance reconciliation engine",
         ""),
    ]

    for num, title, desc, tools_used, status in skills:
        bg = ACCENT_LT if num == "2" else colors.HexColor("#F8FAFC")
        bd = ACCENT if num == "2" else RULE
        sk_data = [[
            Paragraph(f"<b>{num}</b>", ParagraphStyle("skn", fontName="Helvetica-Bold",
                fontSize=14, textColor=ACCENT, leading=18)),
            [
                Paragraph(f"<b>Skill {num} — {title}</b>" + (
                    f" <font color='#16A34A' size='8'>  ✓ PRODUCTION VERIFIED</font>" if status else ""),
                    ParagraphStyle("skt", fontName="Helvetica-Bold", fontSize=10,
                        textColor=INK, leading=14, spaceAfter=3)),
                Paragraph(desc, S["body_muted"]),
                Paragraph(f"<i>Tools: {tools_used}</i>",
                    ParagraphStyle("sktl", fontName="Helvetica-Oblique", fontSize=8,
                        textColor=MUTED, leading=12, spaceBefore=2)),
            ],
        ]]
        skt = Table(sk_data, colWidths=[avail*0.06, avail*0.94])
        skt.setStyle(TableStyle([
            ("BACKGROUND",   (0,0),(-1,-1), bg),
            ("LINEBELOW",    (0,0),(-1,-1), 0.5, bd),
            ("LINEBEFORE",   (0,0),(0,-1), 3, ACCENT if num=="2" else bd),
            ("VALIGN",       (0,0),(-1,-1), "TOP"),
            ("TOPPADDING",   (0,0),(-1,-1), 8),
            ("BOTTOMPADDING",(0,0),(-1,-1), 8),
            ("LEFTPADDING",  (0,0),(0,0), 10),
        ]))
        elems.append(skt)
        elems.append(Spacer(1, 4))

    # ── Section 9 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "9", "Financial Inclusion")

    elems.append(Paragraph(
        "<b>Financial inclusion is not a feature. It is a design constraint.</b>",
        ParagraphStyle("fi_emph", fontName="Helvetica-Bold", fontSize=11,
            textColor=ACCENT, leading=16, spaceAfter=10)))

    elems.append(Paragraph(
        "Servicialo v0.9 formalizes this constraint with three protocol-level requirements "
        "for compliant implementations:", S["body"]))

    fi_items = [
        ("9.1", "Multi-Modal Payment Support",
         "Compliant implementations must support at least three payment modalities: card "
         "payment, bank transfer, and a publicly-subsidized option (FONASA in Chile, or "
         "equivalent national insurance in other jurisdictions). Agents must be able to "
         "query and record any of these without implementation-specific customization."),
        ("9.2", "FONASA / Public Insurance Integration",
         "The protocol defines a codigoPrestacion field on service definitions — the billing "
         "code required for FONASA reimbursement claims in Chile. This field is first-class "
         "in the service schema, not an extension. Similar systems in other countries (CUPS "
         "in Colombia, CBHPM in Brazil) are mapped to the same field."),
        ("9.3", "Partial Payment and Balance Models",
         "Real patients in real economic conditions make partial payments. Servicialo's "
         "financial model supports: outstanding balances carried across sessions, partial "
         "payment recording, payment plan definition via TreatmentPlan.projectedSessions, "
         "and dunning (payment recovery) workflows as protocol-native, not implementation-specific."),
    ]

    for sec, title, desc in fi_items:
        elems.append(Paragraph(f"{sec}  {title}", S["h2"]))
        elems.append(Paragraph(desc, S["body"]))

    elems.append(Paragraph(
        "A scheduling protocol that only works for patients who can pay by card at booking "
        "serves a fraction of the population that needs healthcare. The protocol encodes the "
        "economic reality of the markets it operates in.", S["body_muted"]))

    # ── Section 10 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "10", "Reference Implementation: Coordinalo")

    elems.append(Paragraph(
        "Coordinalo is the <b>verified reference implementation</b> of the Servicialo protocol. "
        "Every protocol feature described in this document exists in production at coordinalo.com.",
        S["body"]))

    elems.append(Paragraph("Implementation Status", S["h2"]))
    impl_data = [
        ["Protocol Feature", "Coordinalo Status"],
        ["35 MCP tools (10 public + 25 authenticated)", "Live at /api/mcp"],
        ["3-Tier Access Model", "API key + mandate system — Live"],
        ["ServiceMandate (Delegated Agency)", "Implemented"],
        ["A2A v0.3 interoperability", "Live at /api/servicialo/{orgSlug}/a2a"],
        ["x-servicialo agent card extension", "Live at /.well-known/agent.json"],
        ["DNS Resolution (6 resolver tools)", "Live — servicialo.com/.well-known/agents.json"],
        ["Genesis Skills 1–2", "Production-verified"],
        ["Genesis Skills 3–5", "In progress"],
        ["FONASA billing codes", "In progress"],
        ["Informed consent module", "Planned"],
        ["PDF clinical record export", "Planned"],
    ]
    elems.append(make_table(impl_data, [avail*0.58, avail*0.42]))
    elems.append(Spacer(1, 10))

    elems.append(Paragraph("Architecture", S["h2"]))
    elems.append(CodeBlock(
"""coordinalo.com
├── /api/mcp                    → MCP server (35 tools, Streamable HTTP)
├── /api/servicialo/{orgSlug}/a2a  → A2A v0.3 message handler (JSON-RPC 2.0)
├── /api/v1                     → REST API (Tier 1 authenticated)
├── /.well-known/
│   ├── agents.json             → Global A2A directory (all orgs)
│   └── mcp.json                → MCP discovery config
└── /api/servicialo/{orgSlug}/
    └── .well-known/
        └── agent.json          → Per-org agent card + x-servicialo block"""))

    elems.append(Paragraph(
        "<b>Mamá Pro</b> (slug: mamapro) — a women's health kinesiology clinic in Santiago, "
        "Chile — serves as the canonical production reference for the Servicialo protocol. "
        "All Genesis skill validations are performed against this live deployment.",
        S["body_muted"]))

    # ── Section 11 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "11", "Ecosystem and Registry")

    elems.append(Paragraph("The Servicialo Registry", S["h2"]))
    elems.append(Paragraph(
        "The public registry at <b>https://servicialo.com/.well-known/agents.json</b> lists "
        "all verified Servicialo-compliant implementations. Registry listing requires:",
        S["body"]))
    for b in [
        "A valid /.well-known/agent.json with the x-servicialo extension",
        "Successful response to all 10 Tier 0 public tools",
        "Protocol version 0.8 or higher",
        "At least one Genesis Skill demonstrated in a staging environment",
    ]:
        elems.append(Paragraph(f"• {b}", S["bullet"]))
    elems.append(Spacer(1, 10))

    elems.append(Paragraph("npm Package", S["h2"]))
    elems.append(CodeBlock("npm install @servicialo/mcp-server"))
    elems.append(Paragraph(
        "The @servicialo/mcp-server package provides a drop-in MCP server that any service "
        "organization can embed. It handles tool routing and validation, tier access "
        "enforcement, mandate validation, and audit event emission.", S["body"]))

    elems.append(Paragraph("SDKs", S["h2"]))
    sdk_data = [
        ["Language", "Package", "Status"],
        ["TypeScript", "@servicialo/sdk", "Available"],
        ["Python", "servicialo (PyPI)", "Available"],
    ]
    elems.append(make_table(sdk_data, [avail*0.2, avail*0.4, avail*0.4]))

    # ── Section 12 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "12", "Roadmap")

    roadmap = [
        ("v1.0 — Q3 2026", "Stable Protocol", [
            "Freeze tool catalog",
            "Formal compliance test suite",
            "Multi-country financial codes (Colombia, Brazil, Mexico)",
            "Signed mandate verification (cryptographic)",
            "Second verified reference implementation (non-Coordinalo)",
        ]),
        ("v1.1 — Q4 2026", "", [
            "Real-time agent presence (agents notify when actively managing a booking)",
            "Aggregate intelligence API (anonymized cross-org signals, Principle 7)",
            "Native FHIR export from clinical notes",
        ]),
        ("v2.0 — 2027", "", [
            "Fully autonomous treatment lifecycle management",
            "Cross-country referral flows",
            "Decentralized mandate registry",
        ]),
    ]

    for ver, subtitle, items in roadmap:
        elems.append(Paragraph(ver + (f"  —  {subtitle}" if subtitle else ""), S["h2"]))
        for item in items:
            elems.append(Paragraph(f"• {item}", S["bullet"]))
        elems.append(Spacer(1, 4))

    # ── Section 13 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "13", "Exceptions and Scope Boundaries")

    elems.append(Paragraph("Servicialo v0.9 explicitly does not define:", S["body"]))
    out_of_scope = [
        ("The user interface", "how humans interact with Servicialo is outside scope"),
        ("The AI model", "any LLM or agent framework may implement the protocol"),
        ("The payment processor", "Stripe, Fintoc, bank transfer, or any other mechanism is valid"),
        ("Clinical decision support", "the protocol stores and routes clinical data but does not interpret it"),
        ("Legal compliance", "implementations must comply with local health data regulations"),
        ("The physical service", "Servicialo orchestrates the interaction but does not deliver the service"),
    ]
    for title, desc in out_of_scope:
        elems.append(Paragraph(f"• <b>{title}</b> — {desc}", S["bullet"]))

    # ── Section 14 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "14", "Conclusion")

    elems.append(Paragraph(
        "Servicialo v0.9 is the first open protocol that treats AI-native service "
        "orchestration — not as an extension of existing booking APIs, but as the "
        "primary design target.", S["body"]))

    elems.append(Paragraph(
        "The three advances in this release — the 3-Tier Access Model, the Delegated "
        "Agency Model, and A2A v0.3 interoperability — together make a substantive claim: "
        "that AI agents can be trusted with consequential service interactions when the "
        "protocol enforces human authority, scoped mandates, and complete audit trails.",
        S["body"]))

    elems.append(Paragraph(
        "The protocol is not theoretical. Coordinalo runs it in production. Mamá Pro "
        "books real patients with it. Genesis Skill 2 — the first fully autonomous "
        "end-to-end booking — has been executed in a live environment.", S["body"]))

    elems.append(Paragraph(
        "The question is no longer whether agentic service orchestration is possible. "
        "It is how quickly the ecosystem converges on an open standard.",
        S["body"]))

    conclusion_data = [["Servicialo is that standard."]]
    ct = Table(conclusion_data, colWidths=[avail])
    ct.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), TABLE_HD),
        ("TEXTCOLOR",    (0,0),(-1,-1), WHITE),
        ("FONTNAME",     (0,0),(-1,-1), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(-1,-1), 13),
        ("LEADING",      (0,0),(-1,-1), 18),
        ("ALIGN",        (0,0),(-1,-1), "CENTER"),
        ("TOPPADDING",   (0,0),(-1,-1), 16),
        ("BOTTOMPADDING",(0,0),(-1,-1), 16),
        ("LINEABOVE",    (0,0),(-1,-1), 2, ACCENT),
    ]))
    elems.append(Spacer(1, 10))
    elems.append(ct)

    # ── Appendix A ─────────────────────────────────────────────────────────────
    elems.append(PageBreak())
    elems += section_header(S, "App. A", "Full Tool Catalog")

    elems.append(Paragraph(
        "35 tools across 3 tiers. Tools 1–10 are public (Tier 0). "
        "Tools 11–25 require authentication (Tier 1). "
        "Tools 26–35 require a ServiceMandate (Tier 2).",
        S["body_muted"]))
    elems.append(Spacer(1, 6))

    tools_data = [["#", "Tool", "Tier", "Domain"]]
    tools = [
        ("1","resolve.lookup","0","DNS"),
        ("2","resolve.search","0","DNS"),
        ("3","trust.get_score","0","Trust"),
        ("4","registry.search","0","Discovery"),
        ("5","registry.get_organization","0","Discovery"),
        ("6","registry.manifest","0","Discovery"),
        ("7","services.list","0","Discovery"),
        ("8","scheduling.check_availability","0","Scheduling"),
        ("9","a2a.get_agent_card","0","A2A"),
        ("10","docs.quickstart","0","Docs"),
        ("11","service.get","1","Services"),
        ("12","contract.get","1","Services"),
        ("13","clients.get_or_create","1","CRM"),
        ("14","scheduling.book","1","Booking"),
        ("15","scheduling.confirm","1","Booking"),
        ("16","lifecycle.get_state","1","Lifecycle"),
        ("17","lifecycle.transition","1","Lifecycle"),
        ("18","scheduling.reschedule","1","Booking"),
        ("19","scheduling.cancel","1","Booking"),
        ("20","delivery.checkin","1","Delivery"),
        ("21","delivery.checkout","1","Delivery"),
        ("22","delivery.record_evidence","1","Delivery"),
        ("23","documentation.create","1","Docs"),
        ("24","payments.create_sale","1","Finance"),
        ("25","payments.record_payment","1","Finance"),
        ("26","payments.get_status","1","Finance"),
        ("27","resource.list","1","Resources"),
        ("28","resource.get","1","Resources"),
        ("29","resource.create","1","Resources"),
        ("30","resource.update","1","Resources"),
        ("31","resource.delete","1","Resources"),
        ("32","resource.get_availability","1","Resources"),
        ("33","resolve.register","1","DNS"),
        ("34","resolve.update_endpoint","1","DNS"),
        ("35","telemetry.heartbeat","1","Telemetry"),
    ]
    tools_data += [list(t) for t in tools]
    elems.append(make_table(tools_data, [avail*0.06, avail*0.47, avail*0.10, avail*0.37]))

    # ── Appendix B ─────────────────────────────────────────────────────────────
    elems.append(Spacer(1, 18))
    elems += section_header(S, "App. B", "Comparison with Prior Versions")

    comp_data = [
        ["Dimension", "v0.6", "v0.9"],
        ["MCP tools", "20", "35 (10 public + 25 authenticated)"],
        ["Core principles", "6", "7 (+ collective intelligence as common good)"],
        ["Exception flows", "7", "6 (reclassified)"],
        ["A2A version", "0.2 (basic)", "0.3 (x-servicialo extension required)"],
        ["Delegation model", "None", "ServiceMandate (Tier 2)"],
        ["Access tiers", "Binary (auth/unauth)", "Tier 0 / Tier 1 / Tier 2"],
        ["DNS resolution", "Draft", "Phase 0 with 6 resolver tools"],
        ["Financial inclusion", "Not addressed", "Protocol-level design constraint"],
        ["Genesis skills", "Not defined", "5 skills — Skill 2 production-verified"],
        ["Registry listing", "Not required", "Required for verified status"],
        ["Agent card extension", "None", "x-servicialo block (implementer + endpoints)"],
    ]
    elems.append(make_table(comp_data, [avail*0.30, avail*0.25, avail*0.45]))

    elems.append(Spacer(1, 20))
    footer_data = [[
        "Servicialo is an open protocol published under the Apache 2.0 license.\n"
        "Coordinalo is the reference implementation. Mamá Pro is the production reference deployment.\n"
        "github.com/servicialo  ·  servicialo.com  ·  coordinalo.com"
    ]]
    ft = Table(footer_data, colWidths=[avail])
    ft.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), colors.HexColor("#F1F5F9")),
        ("TEXTCOLOR",    (0,0),(-1,-1), MUTED),
        ("FONTNAME",     (0,0),(-1,-1), "Helvetica"),
        ("FONTSIZE",     (0,0),(-1,-1), 8),
        ("LEADING",      (0,0),(-1,-1), 13),
        ("ALIGN",        (0,0),(-1,-1), "CENTER"),
        ("TOPPADDING",   (0,0),(-1,-1), 10),
        ("BOTTOMPADDING",(0,0),(-1,-1), 10),
        ("LINEABOVE",    (0,0),(-1,-1), 0.5, RULE),
    ]))
    elems.append(ft)

    return elems


# ─── Main ─────────────────────────────────────────────────────────────────────
def build():
    output_path = r"C:\Users\franc\servicialo\public\docs\servicialo-whitepaper.pdf"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    S = build_styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 0.4*cm,
        bottomMargin=MARGIN + 0.2*cm,
        title="Servicialo Protocol v0.9",
        author="Servicialo",
        subject="An Open Standard for Agentic Service Orchestration",
        creator="@servicialo/mcp-server",
    )

    story = []
    story += cover_page(S)
    story += toc(S)
    story += body_content(S)

    doc.build(
        story,
        onFirstPage=on_cover_page,
        onLaterPages=on_normal_page,
    )

    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    build()
