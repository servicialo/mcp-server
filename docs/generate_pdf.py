"""
Generate a professional PDF whitepaper from whitepaper.md
Usage: py docs/generate_pdf.py
"""

import re
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Flowable, KeepTogether, CondPageBreak,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ─── Config ──────────────────────────────────────────────────────────────────

FONTS_DIR = r"C:\Windows\Fonts"
INPUT_FILE = os.path.join(os.path.dirname(__file__), "whitepaper.md")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "whitepaper.pdf")

# Colors
NAVY       = HexColor("#1a2332")
BLUE       = HexColor("#2563eb")
DARK_BLUE  = HexColor("#1e40af")
LIGHT_GRAY = HexColor("#f8fafc")
MED_GRAY   = HexColor("#e2e8f0")
DARK_GRAY  = HexColor("#64748b")
TEXT_COLOR  = HexColor("#1e293b")
CODE_BG    = HexColor("#f1f5f9")
CODE_BORDER= HexColor("#cbd5e1")
QUOTE_BG   = HexColor("#eff6ff")
QUOTE_BORDER = HexColor("#3b82f6")
TBL_HDR_BG = HexColor("#1e293b")
TBL_HDR_FG = white
TBL_BORDER = HexColor("#cbd5e1")
TBL_ALT_BG = HexColor("#f8fafc")
HR_COLOR   = HexColor("#e2e8f0")

PAGE_W, PAGE_H = A4
ML = 22 * mm
MR = 22 * mm
MT = 22 * mm
MB = 20 * mm
CONTENT_W = PAGE_W - ML - MR

# ─── Fonts ───────────────────────────────────────────────────────────────────

pdfmetrics.registerFont(TTFont("Body",       os.path.join(FONTS_DIR, "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold",  os.path.join(FONTS_DIR, "segoeuib.ttf")))
pdfmetrics.registerFont(TTFont("Body-It",    os.path.join(FONTS_DIR, "segoeuii.ttf")))
pdfmetrics.registerFont(TTFont("Code",       os.path.join(FONTS_DIR, "consola.ttf")))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold",
                              italic="Body-It", boldItalic="Body-Bold")

# Try to register bold-italic if available
try:
    pdfmetrics.registerFont(TTFont("Body-BoldIt", os.path.join(FONTS_DIR, "segoeuiz.ttf")))
    pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold",
                                  italic="Body-It", boldItalic="Body-BoldIt")
except:
    pass

# ─── Styles ──────────────────────────────────────────────────────────────────

S = {}
S["h2"] = ParagraphStyle("H2", fontName="Body-Bold", fontSize=15, leading=20,
    textColor=NAVY, spaceBefore=7*mm, spaceAfter=3*mm, keepWithNext=1)
S["h3"] = ParagraphStyle("H3", fontName="Body-Bold", fontSize=12, leading=16,
    textColor=DARK_BLUE, spaceBefore=5*mm, spaceAfter=2*mm, keepWithNext=1)
S["h4"] = ParagraphStyle("H4", fontName="Body-Bold", fontSize=10.5, leading=14,
    textColor=DARK_BLUE, spaceBefore=3.5*mm, spaceAfter=1.5*mm, keepWithNext=1)
S["body"] = ParagraphStyle("Body", fontName="Body", fontSize=9.5, leading=14,
    textColor=TEXT_COLOR, alignment=TA_JUSTIFY, spaceAfter=2.5*mm)
S["subtitle"] = ParagraphStyle("Sub", fontName="Body", fontSize=10.5, leading=15,
    textColor=DARK_GRAY, spaceAfter=3*mm)
S["quote"] = ParagraphStyle("Quote", fontName="Body-It", fontSize=9, leading=13.5,
    textColor=HexColor("#475569"), alignment=TA_JUSTIFY, spaceAfter=0.5*mm)
S["li"] = ParagraphStyle("LI", fontName="Body", fontSize=9.5, leading=14,
    textColor=TEXT_COLOR, leftIndent=7*mm, bulletIndent=2*mm, spaceAfter=1.2*mm)
S["kw"] = ParagraphStyle("KW", fontName="Body-It", fontSize=9, leading=13,
    textColor=DARK_GRAY, spaceAfter=2*mm)
# Table styles
S["th"] = ParagraphStyle("TH", fontName="Body-Bold", fontSize=8, leading=11,
    textColor=TBL_HDR_FG)
S["td"] = ParagraphStyle("TD", fontName="Body", fontSize=8, leading=11.5,
    textColor=TEXT_COLOR)
S["td_b"] = ParagraphStyle("TDB", fontName="Body-Bold", fontSize=8, leading=11.5,
    textColor=TEXT_COLOR)
S["footer"] = ParagraphStyle("Ft", fontName="Body", fontSize=7.5, leading=10,
    textColor=DARK_GRAY, alignment=TA_CENTER)

# ─── Helpers ─────────────────────────────────────────────────────────────────

def fmt(text):
    """Convert markdown inline formatting to ReportLab XML."""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    # Bold+italic
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic (careful not to match inside words or URLs)
    text = re.sub(r'(?<![a-zA-Z/:])\*([^*\n]+?)\*(?![a-zA-Z])', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`([^`]+?)`',
        lambda m: f'<font name="Code" size="7.5" color="#be123c">{m.group(1)}</font>', text)
    # Links
    text = re.sub(r'\[([^\]]+?)\]\([^\)]+?\)', r'<font color="#2563eb"><u>\1</u></font>', text)
    return text

def fmt_cell(text):
    """Format text for a table cell — strips outer bold markers for the style."""
    return fmt(text)

# ─── Custom Flowables ────────────────────────────────────────────────────────

class HR(Flowable):
    def __init__(self, color=HR_COLOR, thickness=0.5):
        super().__init__()
        self._color = color
        self._thickness = thickness
    def wrap(self, aW, aH):
        return (aW, self._thickness + 4*mm)
    def draw(self):
        self.canv.setStrokeColor(self._color)
        self.canv.setLineWidth(self._thickness)
        self.canv.line(0, 2*mm, self.width, 2*mm)


def build_quote_box(text_parts, avail_w=None):
    """Build a blockquote as a Table with left accent border and background."""
    avail_w = avail_w or CONTENT_W
    data = [[p] for p in text_parts]
    tbl = Table(data, colWidths=[avail_w - 2*mm])
    cmds = [
        ("BACKGROUND",    (0, 0), (-1, -1), QUOTE_BG),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7*mm),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 4*mm),
        ("TOPPADDING",    (0, 0), (0, 0), 3*mm),
        ("TOPPADDING",    (0, 1), (-1, -1), 0.5*mm),
        ("BOTTOMPADDING", (0, 0), (-1, -2), 0.5*mm),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 3*mm),
        ("LINEBEFOREDECOR", (0, 0), (0, -1), 2.5, QUOTE_BORDER),
        ("BOX",           (0, 0), (-1, -1), 0.01, QUOTE_BG),  # round off
    ]
    tbl.setStyle(TableStyle(cmds))
    return tbl


def build_code_box(text, avail_w=None):
    """Build a code block as a multi-row Table — one row per line for proper splitting."""
    avail_w = avail_w or CONTENT_W
    lines = text.split("\n")
    n = len(lines)
    maxlen = max((len(l) for l in lines), default=0)
    if maxlen > 85 or n > 70:
        fs, ld = 5.0, 6.8
    elif maxlen > 70 or n > 45:
        fs, ld = 5.5, 7.5
    else:
        fs, ld = 6.2, 8.5
    style = ParagraphStyle("Code_Line", fontName="Code", fontSize=fs,
        leading=ld, textColor=TEXT_COLOR)
    # Build one row per line
    data = []
    for line in lines:
        safe = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        safe = safe.replace(" ", "&nbsp;") if safe else "&nbsp;"
        data.append([Paragraph(safe, style)])

    tbl = Table(data, colWidths=[avail_w - 1*mm])
    cmds = [
        ("BACKGROUND",    (0, 0), (-1, -1), CODE_BG),
        ("LEFTPADDING",   (0, 0), (-1, -1), 2.5*mm),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 2.5*mm),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        # Extra padding on first and last rows
        ("TOPPADDING",    (0, 0), (0, 0), 2.5*mm),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 2.5*mm),
        ("BOX",           (0, 0), (-1, -1), 0.4, CODE_BORDER),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]
    tbl.setStyle(TableStyle(cmds))
    return tbl


# ─── Table Builder ───────────────────────────────────────────────────────────

def build_table(rows, avail_w=None):
    """Build a beautifully formatted table from parsed rows."""
    if not rows or len(rows) < 2:
        return Spacer(1, 1)

    avail_w = avail_w or CONTENT_W
    ncols = len(rows[0])

    # Measure content to compute smart column widths
    col_max_len = [0] * ncols
    col_has_long = [False] * ncols
    for row in rows:
        for ci, cell in enumerate(row[:ncols]):
            plain = re.sub(r'[*`\[\]\(\)]', '', cell)
            col_max_len[ci] = max(col_max_len[ci], len(plain))
            if len(plain) > 40:
                col_has_long[ci] = True

    total_len = sum(col_max_len) or 1

    # Calculate proportional widths with min/max constraints
    raw_widths = []
    for ci in range(ncols):
        ratio = col_max_len[ci] / total_len
        w = ratio * avail_w
        # Enforce minimums and maximums
        w = max(w, 18*mm)  # minimum column width
        w = min(w, avail_w * 0.55)  # max 55% for any single column
        raw_widths.append(w)

    # Normalize to fit available width
    total_raw = sum(raw_widths)
    col_widths = [w * avail_w / total_raw for w in raw_widths]

    # Build cell content
    data = []
    for ri, row in enumerate(rows):
        cells = []
        for ci in range(ncols):
            cell_text = row[ci] if ci < len(row) else ""
            if ri == 0:
                # Header
                cells.append(Paragraph(fmt_cell(cell_text), S["th"]))
            else:
                # Detect if first column is bold-ish (starts with **)
                style = S["td"]
                if ci == 0 and cell_text.startswith("**"):
                    style = S["td_b"]
                cells.append(Paragraph(fmt_cell(cell_text), style))
        data.append(cells)

    tbl = Table(data, colWidths=col_widths, repeatRows=1)

    cmds = [
        # Header row
        ("BACKGROUND",    (0, 0), (-1, 0), TBL_HDR_BG),
        ("TEXTCOLOR",     (0, 0), (-1, 0), TBL_HDR_FG),
        # Padding
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        # Header extra padding
        ("TOPPADDING",    (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        # Alignment
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        # Borders — clean subtle grid
        ("LINEBELOW",     (0, 0), (-1, 0), 1.2, TBL_HDR_BG),  # thick line under header
        ("LINEBELOW",     (0, 1), (-1, -1), 0.3, TBL_BORDER),  # subtle lines between rows
        ("LINEBEFORE",    (1, 0), (-1, -1), 0.3, TBL_BORDER),  # subtle column separators
        # Outer border
        ("BOX",           (0, 0), (-1, -1), 0.5, TBL_BORDER),
    ]

    # Alternating row backgrounds
    for ri in range(1, len(data)):
        if ri % 2 == 0:
            cmds.append(("BACKGROUND", (0, ri), (-1, ri), TBL_ALT_BG))

    tbl.setStyle(TableStyle(cmds))
    return tbl


# ─── Markdown Parser ─────────────────────────────────────────────────────────

def parse_table_rows(lines):
    """Parse markdown table lines, skipping separator rows."""
    rows = []
    for line in lines:
        line = line.strip()
        if line.startswith("|") and line.endswith("|"):
            cells = [c.strip() for c in line.split("|")[1:-1]]
            if all(re.match(r'^[-:]+$', c) for c in cells):
                continue
            rows.append(cells)
    return rows


def parse_md(filepath):
    """Parse markdown into blocks: (type, data...)."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Strip frontmatter
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            content = content[end+3:].strip()

    lines = content.split("\n")
    blocks = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Code block
        if stripped.startswith("```"):
            code = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            blocks.append(("code", "\n".join(code)))
            i += 1
            continue

        # Table
        if "|" in stripped and stripped.startswith("|"):
            tlines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                tlines.append(lines[i])
                i += 1
            rows = parse_table_rows(tlines)
            if rows:
                blocks.append(("table", rows))
            continue

        # Headers
        for lvl, prefix in [(4, "#### "), (3, "### "), (2, "## "), (1, "# ")]:
            if stripped.startswith(prefix):
                blocks.append((f"h{lvl}", stripped[len(prefix):]))
                i += 1
                break
        else:
            # HR
            if re.match(r'^---+\s*$', stripped):
                blocks.append(("hr",))
                i += 1
                continue

            # Blockquote
            if stripped.startswith(">"):
                qlines = []
                while i < len(lines) and lines[i].strip().startswith(">"):
                    q = lines[i].strip()
                    q = q[2:] if q.startswith("> ") else (q[1:] if len(q) > 1 else "")
                    qlines.append(q)
                    i += 1
                blocks.append(("quote", "\n".join(qlines)))
                continue

            # Unordered list
            if re.match(r'^[-*]\s', stripped):
                items = []
                while i < len(lines) and re.match(r'^[-*]\s', lines[i].strip()):
                    items.append(re.sub(r'^[-*]\s', '', lines[i].strip()))
                    i += 1
                blocks.append(("ul", items))
                continue

            # Ordered list
            if re.match(r'^\d+\.\s', stripped):
                items = []
                while i < len(lines) and re.match(r'^\d+\.\s', lines[i].strip()):
                    items.append(re.sub(r'^\d+\.\s', '', lines[i].strip()))
                    i += 1
                blocks.append(("ol", items))
                continue

            # Empty
            if stripped == "":
                i += 1
                continue

            # Paragraph
            plines = []
            while i < len(lines):
                l = lines[i].strip()
                if l == "" or l.startswith("#") or l.startswith("|") or \
                   l.startswith("```") or l.startswith(">") or \
                   re.match(r'^---+\s*$', l) or re.match(r'^[-*]\s', l) or \
                   re.match(r'^\d+\.\s', l):
                    break
                plines.append(l)
                i += 1
            if plines:
                blocks.append(("para", " ".join(plines)))
            continue

        # If header was matched (the for-else above), continue
        continue

    return blocks


# ─── PDF Assembly ────────────────────────────────────────────────────────────

def make_cover():
    """Build cover page elements."""
    els = []
    els.append(Spacer(1, 45*mm))

    els.append(Paragraph("Servicialo", ParagraphStyle("CT",
        fontName="Body-Bold", fontSize=40, leading=46, textColor=NAVY)))
    els.append(Spacer(1, 3*mm))

    els.append(Paragraph(
        "Un Protocolo Abierto para la Orquestaci\u00f3n de<br/>"
        "Servicios Profesionales en la Econom\u00eda de<br/>"
        "Agentes de Inteligencia Artificial",
        ParagraphStyle("CS", fontName="Body", fontSize=15, leading=21,
                       textColor=DARK_BLUE)))
    els.append(Spacer(1, 10*mm))
    els.append(HR(color=BLUE, thickness=2))
    els.append(Spacer(1, 6*mm))

    meta = ParagraphStyle("CM", fontName="Body", fontSize=10.5, leading=15,
                          textColor=DARK_GRAY)
    els.append(Paragraph("Versi\u00f3n 0.6.0 \u2014 Marzo 2026", meta))
    els.append(Paragraph("Licencia MIT", meta))
    els.append(Spacer(1, 16*mm))

    # Citation block
    cl = ParagraphStyle("CL", fontName="Body-Bold", fontSize=8, leading=12,
                        textColor=DARK_GRAY, leftIndent=5*mm)
    ct = ParagraphStyle("CT2", fontName="Body-It", fontSize=8, leading=12,
                        textColor=DARK_GRAY, leftIndent=5*mm)
    cite_parts = [
        Paragraph("Citaci\u00f3n APA:", cl),
        Paragraph(
            'Servicialo. (2026). <i>Servicialo: Un protocolo abierto para la '
            'orquestaci\u00f3n de servicios profesionales en la econom\u00eda de agentes '
            'de inteligencia artificial</i> (Versi\u00f3n 0.6.0). https://servicialo.com', ct),
        Paragraph("Citaci\u00f3n ISO 690:", cl),
        Paragraph(
            'SERVICIALO. <i>Servicialo: Un protocolo abierto para la orquestaci\u00f3n '
            'de servicios profesionales en la econom\u00eda de agentes de inteligencia '
            'artificial</i> [en l\u00ednea]. Versi\u00f3n 0.6.0. Marzo 2026. '
            'Disponible en: https://servicialo.com', ct),
    ]
    els.append(build_quote_box(cite_parts))
    els.append(Spacer(1, 12*mm))

    url = ParagraphStyle("URL", fontName="Code", fontSize=9, leading=13, textColor=BLUE)
    els.append(Paragraph("https://servicialo.com", url))
    els.append(Paragraph("https://github.com/servicialo/mcp-server", url))
    els.append(PageBreak())
    return els


def blocks_to_elements(blocks):
    """Convert parsed blocks to ReportLab flowables with page distribution."""
    els = []
    skip_h1 = True

    for i, block in enumerate(blocks):
        t = block[0]

        # Helper: peek at next non-empty block type
        def next_block_type():
            for j in range(i + 1, len(blocks)):
                return blocks[j][0]
            return None

        if t == "h1":
            if skip_h1:
                skip_h1 = False
                continue
            els.append(Paragraph(fmt(block[1]), S["h2"]))

        elif t == "h2":
            # Major section: new page if less than 45mm left
            els.append(CondPageBreak(45*mm))
            els.append(HR(color=BLUE, thickness=0.8))
            els.append(Paragraph(fmt(block[1]), S["h2"]))

        elif t == "h3":
            els.append(Paragraph(fmt(block[1]), S["h3"]))

        elif t == "h4":
            els.append(Paragraph(fmt(block[1]), S["h4"]))

        elif t == "para":
            txt = block[1]
            if txt.startswith("**Versi\u00f3n"):
                els.append(Paragraph(fmt(txt), S["subtitle"]))
            else:
                els.append(Paragraph(fmt(txt), S["body"]))

        elif t == "quote":
            raw = block[1]
            parts = [p.strip() for p in raw.split("\n") if p.strip()]
            paras = [Paragraph(fmt(p), S["quote"]) for p in parts]
            if paras:
                els.append(Spacer(1, 1*mm))
                els.append(build_quote_box(paras))
                els.append(Spacer(1, 1.5*mm))

        elif t == "code":
            els.append(Spacer(1, 0.5*mm))
            els.append(build_code_box(block[1]))
            els.append(Spacer(1, 1.5*mm))

        elif t == "table":
            els.append(Spacer(1, 0.5*mm))
            els.append(build_table(block[1]))
            els.append(Spacer(1, 1.5*mm))

        elif t == "ul":
            for item in block[1]:
                els.append(Paragraph(f'\u2022  {fmt(item)}', S["li"]))
            els.append(Spacer(1, 0.5*mm))

        elif t == "ol":
            for idx, item in enumerate(block[1], 1):
                els.append(Paragraph(f'{idx}.  {fmt(item)}', S["li"]))
            els.append(Spacer(1, 0.5*mm))

        elif t == "hr":
            els.append(HR())

    return els


def header_footer(canvas, doc):
    """Draw header/footer on each page."""
    canvas.saveState()
    pn = canvas.getPageNumber()
    if pn > 1:
        # Footer
        fy = MB - 6*mm
        canvas.setStrokeColor(MED_GRAY)
        canvas.setLineWidth(0.3)
        canvas.line(ML, fy + 3.5*mm, PAGE_W - MR, fy + 3.5*mm)
        canvas.setFont("Body", 7.5)
        canvas.setFillColor(DARK_GRAY)
        canvas.drawCentredString(PAGE_W/2, fy, f"Servicialo v0.6.0  \u2014  P\u00e1gina {pn}")
        # Header
        hy = PAGE_H - MT + 4*mm
        canvas.setStrokeColor(MED_GRAY)
        canvas.line(ML, hy, PAGE_W - MR, hy)
        canvas.setFont("Body", 7)
        canvas.setFillColor(DARK_GRAY)
        canvas.drawString(ML, hy + 1.5*mm, "Servicialo: Protocolo Abierto para Servicios Profesionales")
        canvas.drawRightString(PAGE_W - MR, hy + 1.5*mm, "servicialo.com")
    canvas.restoreState()


def main():
    print("Parsing whitepaper.md...")
    blocks = parse_md(INPUT_FILE)
    print(f"  {len(blocks)} blocks found")

    print("Building PDF...")
    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=A4,
        leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB,
        title="Servicialo: Protocolo Abierto para Servicios Profesionales",
        author="Servicialo (servicialo.com)",
        subject="Whitepaper v0.6.0",
        keywords="protocolo abierto servicios profesionales agentes IA MCP")

    els = make_cover()
    els.extend(blocks_to_elements(blocks))

    # Closing
    els.append(Spacer(1, 5*mm))
    els.append(Paragraph("https://servicialo.com",
        ParagraphStyle("U", fontName="Code", fontSize=10, leading=14,
                       textColor=BLUE, alignment=TA_CENTER)))

    doc.build(els, onFirstPage=header_footer, onLaterPages=header_footer)
    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"  Done! {OUTPUT_FILE}")
    print(f"  {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
