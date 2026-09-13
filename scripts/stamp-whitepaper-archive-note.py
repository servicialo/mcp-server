"""
Estampa una nota de archivo fechada como primera página de los PDF del
whitepaper v0.9 y escribe los binarios servidos en public/docs/.

El contenido original no se toca: las páginas del PDF de origen se copian
tal cual detrás de la página de nota. Los originales sin estampar viven en
docs/archive/ y son la única entrada de este script.

Uso:
    pip install pypdf reportlab
    python scripts/stamp-whitepaper-archive-note.py

Verificación: el script compara el texto de cada página original con el de
la página correspondiente del PDF estampado y falla si difiere.
"""

import io
import os
import sys
from datetime import datetime, timezone, timedelta

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Fecha del estampado (única fuente de verdad de este script).
STAMP_DATE = datetime(2026, 9, 13, tzinfo=timezone(timedelta(hours=-3)))

# Misma paleta que scripts/generate-whitepaper*.py
INK = colors.HexColor("#0F172A")
MUTED = colors.HexColor("#475569")
ACCENT = colors.HexColor("#6366F1")
ACCENT_LT = colors.HexColor("#EEF2FF")
RULE = colors.HexColor("#E2E8F0")

PAGE_W, PAGE_H = A4
MARGIN = 2.2 * cm

DOCS = [
    {
        "lang": "es",
        "source": "docs/archive/servicialo-whitepaper-v0.9-es.original.pdf",
        "target": "public/docs/servicialo-whitepaper.pdf",
        "kicker": "NOTA DE ARCHIVO",
        "title": "Documento histórico — corte v0.9 (marzo 2026)",
        "dateline": "Nota agregada el 13 de septiembre de 2026",
        "paragraphs": [
            "Este PDF es un documento histórico. Corresponde al corte v0.9 del "
            "protocolo Servicialo, publicado en marzo de 2026, y no se actualiza.",
            "Las afirmaciones sobre lo que existe en producción describen el estado "
            "declarado en esa fecha, no el estado actual. Lo mismo aplica a las cifras "
            "(conteos de herramientas), al modelo de estados del ciclo de vida y a la "
            "verificación automática tras una ventana de silencio tal como se describen "
            "en estas páginas.",
            "El estado vigente del protocolo se publica en "
            '<a href="https://servicialo.com/spec" color="#6366F1">servicialo.com/spec</a>.',
        ],
        "footnote": (
            "Esta página se agregó el 13 de septiembre de 2026. El resto del documento "
            "se conserva tal como se publicó en marzo de 2026, sin cambios."
        ),
        "running": "servicialo.com  -  Apache 2.0  -  Estandar abierto",
    },
    {
        "lang": "en",
        "source": "docs/archive/servicialo-whitepaper-v0.9-en.original.pdf",
        "target": "public/docs/servicialo-whitepaper-en.pdf",
        "kicker": "ARCHIVE NOTICE",
        "title": "Historical document — v0.9 cut (March 2026)",
        "dateline": "Notice added on 13 September 2026",
        "paragraphs": [
            "This PDF is a historical document. It corresponds to the v0.9 cut of the "
            "Servicialo protocol, published in March 2026, and is not updated.",
            "Statements about what exists in production describe the state declared "
            "at that date, not the current state. The same applies to the figures "
            "(tool counts) and to the protocol model as described in these pages.",
            "The current state of the protocol is published at "
            '<a href="https://servicialo.com/spec" color="#6366F1">servicialo.com/spec</a>.',
        ],
        "footnote": (
            "This page was added on 13 September 2026. The rest of the document is "
            "preserved exactly as published in March 2026, unchanged."
        ),
        "running": "servicialo.com  ·  Apache 2.0  ·  Open Standard",
    },
]


def _on_page(running):
    def draw(canvas, doc):
        w, h = PAGE_W, PAGE_H
        canvas.saveState()
        canvas.setFillColor(ACCENT)
        canvas.rect(0, h - 4, w, 4, stroke=0, fill=1)
        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawString(MARGIN, MARGIN - 14, running)
        canvas.restoreState()

    return draw


def build_note_page(spec):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 0.4 * cm,
        bottomMargin=MARGIN + 0.2 * cm,
    )
    kicker = ParagraphStyle(
        "kicker", fontName="Helvetica-Bold", fontSize=9, leading=12,
        textColor=ACCENT, spaceAfter=10,
    )
    title = ParagraphStyle(
        "title", fontName="Helvetica-Bold", fontSize=20, leading=26,
        textColor=INK, spaceAfter=6, alignment=TA_LEFT,
    )
    dateline = ParagraphStyle(
        "dateline", fontName="Helvetica", fontSize=10, leading=14,
        textColor=MUTED, spaceAfter=18,
    )
    body = ParagraphStyle(
        "body", fontName="Helvetica", fontSize=11, leading=17,
        textColor=INK, spaceAfter=10,
    )
    foot = ParagraphStyle(
        "foot", fontName="Helvetica-Oblique", fontSize=9, leading=13,
        textColor=MUTED,
    )

    avail = PAGE_W - 2 * MARGIN
    box_content = [Paragraph(p, body) for p in spec["paragraphs"]]
    box = Table([[box_content]], colWidths=[avail])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT_LT),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elems = [
        Spacer(1, 1.2 * cm),
        Paragraph(spec["kicker"], kicker),
        Paragraph(spec["title"], title),
        Paragraph(spec["dateline"], dateline),
        box,
        Spacer(1, 14),
        Paragraph(spec["footnote"], foot),
    ]
    doc.build(elems, onFirstPage=_on_page(spec["running"]))
    buf.seek(0)
    return PdfReader(buf)


def stamp(spec):
    src_path = os.path.join(REPO, spec["source"])
    dst_path = os.path.join(REPO, spec["target"])
    src = PdfReader(src_path)
    note = build_note_page(spec)
    assert len(note.pages) == 1, "la nota debe caber en una sola página"

    writer = PdfWriter()
    writer.add_page(note.pages[0])
    for page in src.pages:
        writer.add_page(page)

    meta = dict(src.metadata or {})
    meta["/ModDate"] = STAMP_DATE.strftime("D:%Y%m%d%H%M%S-03'00'")
    writer.add_metadata(meta)

    with open(dst_path, "wb") as fh:
        writer.write(fh)

    # Verificación: cada página original debe seguir igual, desplazada en 1.
    out = PdfReader(dst_path)
    if len(out.pages) != len(src.pages) + 1:
        raise SystemExit(f"{dst_path}: conteo de páginas inesperado")
    for i, page in enumerate(src.pages):
        if (page.extract_text() or "") != (out.pages[i + 1].extract_text() or ""):
            raise SystemExit(f"{dst_path}: la página original {i + 1} difiere tras el estampado")
    print(f"{spec['target']}: {len(src.pages)} páginas originales + 1 nota → {len(out.pages)} páginas")


if __name__ == "__main__":
    for spec in DOCS:
        stamp(spec)
    sys.exit(0)
