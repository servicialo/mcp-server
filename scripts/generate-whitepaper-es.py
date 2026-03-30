"""
Genera el Whitepaper Servicialo Protocol v0.9 en ESPAÑOL
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

# ─── Colores ─────────────────────────────────────────────────────────────────
INK       = colors.HexColor("#0F172A")
MUTED     = colors.HexColor("#475569")
ACCENT    = colors.HexColor("#6366F1")
ACCENT_LT = colors.HexColor("#EEF2FF")
RULE      = colors.HexColor("#E2E8F0")
CODE_BG   = colors.HexColor("#F8FAFC")
CODE_BD   = colors.HexColor("#CBD5E1")
TABLE_HD  = colors.HexColor("#1E293B")
TABLE_ALT = colors.HexColor("#F8FAFC")
WHITE     = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 2.2 * cm

# ─── Estilos ──────────────────────────────────────────────────────────────────
def build_styles():
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
            backColor=CODE_BG, spaceAfter=2),
        "bullet": S("bullet",
            fontName="Helvetica", fontSize=10, leading=15,
            textColor=INK, leftIndent=16, spaceAfter=3,
            bulletIndent=4),
    }


# ─── Flowables ────────────────────────────────────────────────────────────────
class AccentRule(Flowable):
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
        self.canv.setFillColor(CODE_BG)
        self.canv.roundRect(0, 0, w, h, 4, stroke=0, fill=1)
        self.canv.setStrokeColor(CODE_BD)
        self.canv.setLineWidth(0.5)
        self.canv.roundRect(0, 0, w, h, 4, stroke=1, fill=0)
        self.canv.setFillColor(ACCENT)
        self.canv.rect(0, 0, 3, h, stroke=0, fill=1)
        self.canv.setFillColor(INK)
        self.canv.setFont("Courier", self.font_size)
        lines = self.code_text.split('\n')
        y = h - self.padding - self.font_size
        for line in lines:
            self.canv.drawString(self.padding + 4, y, line)
            y -= self.line_height


# ─── Page templates ───────────────────────────────────────────────────────────
def on_cover_page(canvas, doc):
    w, h = A4
    canvas.setFillColor(colors.HexColor("#0F172A"))
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#1E1B4B"))
    canvas.rect(0, h * 0.55, w, h * 0.45, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#1E293B"))
    canvas.setLineWidth(0.4)
    for x in range(0, int(w), 28):
        canvas.line(x, 0, x, h)
    for y in range(0, int(h), 28):
        canvas.line(0, y, w, y)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h - 4, w, 4, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#1E1B4B"))
    canvas.rect(0, 0, w, 22, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#6366F1"))
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN, 8, "servicialo.com  -  Apache 2.0  -  Estandar abierto")
    canvas.setFillColor(colors.HexColor("#818CF8"))
    canvas.drawRightString(w - MARGIN, 8, "v0.9  -  Marzo 2026")


def on_normal_page(canvas, doc):
    w, h = A4
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, h - MARGIN + 6, w - MARGIN, h - MARGIN + 6)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN, h - MARGIN + 9, "Servicialo Protocol  -  v0.9  -  Marzo 2026")
    canvas.drawRightString(w - MARGIN, h - MARGIN + 9, "Estandar abierto para coordinacion de servicios")
    canvas.line(MARGIN, MARGIN - 6, w - MARGIN, MARGIN - 6)
    canvas.drawCentredString(w / 2, MARGIN - 14, str(doc.page))
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#CBD5E1"))
    canvas.drawString(MARGIN, MARGIN - 14, "servicialo.com")
    canvas.drawRightString(w - MARGIN, MARGIN - 14, "Apache 2.0")


# ─── Tabla helper ─────────────────────────────────────────────────────────────
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


def section_header(S, number, title):
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


# ─── Portada ──────────────────────────────────────────────────────────────────
def cover_page(S):
    avail = PAGE_W - 2 * MARGIN
    elems = []
    elems.append(Spacer(1, 5.5 * cm))

    badge_data = [["ESTANDAR ABIERTO  -  APACHE 2.0  -  RELEASE CANDIDATE"]]
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
    elems.append(Paragraph("Estandar abierto para la coordinacion de servicios profesionales",
        S["cover_sub"]))

    elems.append(Spacer(1, 10))
    rule_data = [["",""]]
    rt = Table(rule_data, colWidths=[avail * 0.07, avail * 0.93])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(0,0), ACCENT),
        ("BACKGROUND", (1,0),(1,0), colors.HexColor("#312E81")),
        ("TOPPADDING", (0,0),(-1,-1), 1),
        ("BOTTOMPADDING",(0,0),(-1,-1), 1),
    ]))
    elems.append(rt)
    elems.append(Spacer(1, 28))

    meta = [
        ["Version", "0.9", "Estado", "Release Candidate"],
        ["Fecha", "Marzo 2026", "Licencia", "Apache 2.0"],
        ["Registro", "servicialo.com/.well-known/agents.json", "Paquete MCP", "@servicialo/mcp-server"],
        ["Impl. de referencia", "Coordinalo (coordinalo.com)", "Herramientas", "35 tools MCP"],
    ]
    mt = Table(meta, colWidths=[avail*0.16, avail*0.34, avail*0.16, avail*0.34])
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

    elems.append(Paragraph("RESUMEN", S["cover_abstract_head"]))
    abstract = (
        "Servicialo es un protocolo abierto que permite a los agentes de IA descubrir, "
        "negociar y ejecutar interacciones de servicios del mundo real — incluyendo "
        "agendamiento, facturacion, gestion clinica y derivaciones entre organizaciones — "
        "sin intermediacion humana. La version 0.9 introduce tres avances fundamentales: "
        "un Modelo de Acceso en 3 Niveles que distingue capacidades publicas, autenticadas "
        "y restringidas; un Modelo de Agencia Delegada que permite a los agentes actuar "
        "con mandatos verificados y acotados en nombre de personas y organizaciones; "
        "e interoperabilidad A2A v0.3 para composicion con cualquier sistema compatible "
        "con A2A. El protocolo esta implementado en produccion por Coordinalo, "
        "la implementacion de referencia. Con la version 0.9, el catalogo de herramientas "
        "crece a 35 tools MCP y el protocolo incorpora la inclusion financiera "
        "como restriccion de diseno, no como caracteristica adicional."
    )
    elems.append(Paragraph(abstract, S["cover_abstract"]))
    elems.append(PageBreak())
    return elems


# ─── Indice ───────────────────────────────────────────────────────────────────
def toc(S):
    avail = PAGE_W - 2 * MARGIN
    elems = []
    elems.append(Paragraph("Indice", S["h1"]))
    elems.append(AccentRule())
    elems.append(Spacer(1, 12))

    sections = [
        ("1.", "El problema", []),
        ("2.", "Descripcion del protocolo", [("2.1", "Historial de versiones")]),
        ("3.", "Principios fundamentales", []),
        ("4.", "Modelo de acceso en 3 niveles", [
            ("4.0", "Nivel 0 — Publico (10 herramientas)"),
            ("4.1", "Nivel 1 — Autenticado (25 herramientas)"),
            ("4.2", "Nivel 2 — Delegado (ServiceMandate)"),
        ]),
        ("5.", "Las 8 dimensiones del servicio", []),
        ("6.", "9 estados universales del ciclo de vida", []),
        ("7.", "6 flujos de excepcion", []),
        ("8.", "7 principios del estandar", []),
        ("9.", "Sistema de resolucion DNS", [
            ("9.1", "Cadena de resolucion"),
            ("9.2", "6 herramientas de resolucion"),
            ("9.3", "Extension x-servicialo"),
        ]),
        ("10.", "Modelo de agencia delegada", [
            ("10.1", "ServiceMandate"),
            ("10.2", "Ciclo de vida del mandato"),
        ]),
        ("11.", "Interoperabilidad A2A v0.3", []),
        ("12.", "Habilidades Genesis del agente", []),
        ("13.", "Inclusion financiera", []),
        ("14.", "Implementacion de referencia: Coordinalo", []),
        ("15.", "Ecosistema y registro", []),
        ("16.", "Hoja de ruta", []),
        ("17.", "Conclusion", []),
        ("Apend. A", "Catalogo completo de herramientas", []),
        ("Apend. B", "Comparativa con versiones anteriores", []),
    ]

    for num, title, subs in sections:
        row_data = [[
            Paragraph(f"<b>{num}</b>", ParagraphStyle("tn", fontName="Helvetica-Bold",
                fontSize=9.5, textColor=ACCENT, leading=14)),
            Paragraph(title, ParagraphStyle("tt", fontName="Helvetica-Bold",
                fontSize=10, textColor=INK, leading=14)),
        ]]
        rt = Table(row_data, colWidths=[avail*0.10, avail*0.90])
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
            sr = Table(sub_data, colWidths=[avail*0.12, avail*0.88])
            sr.setStyle(TableStyle([
                ("TOPPADDING",   (0,0),(-1,-1), 1),
                ("BOTTOMPADDING",(0,0),(-1,-1), 2),
                ("LEFTPADDING",  (0,0),(-1,-1), 18),
            ]))
            elems.append(sr)

    elems.append(PageBreak())
    return elems


# ─── Contenido ────────────────────────────────────────────────────────────────
def body_content(S):
    avail = PAGE_W - 2 * MARGIN
    elems = []

    # ── Seccion 1 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "1", "El Problema")
    elems.append(Paragraph(
        "La entrega de servicios profesionales — en salud, consultoria, servicios del hogar, "
        "educacion — esta fragmentada a nivel de infraestructura. Cada clinica, agencia "
        "y consultorio tiene su propio sistema de agenda. Cada plataforma de facturacion "
        "habla su propio idioma. Las derivaciones entre organizaciones dependen de llamadas "
        "telefonicas, mensajes de WhatsApp y reingreso manual de datos.", S["body"]))
    elems.append(Paragraph(
        "La aparicion de agentes de IA capaces de actuar de forma autonoma ha expuesto "
        "esta fragmentacion como una falla sistemica. Un agente que puede redactar un correo, "
        "consultar una base de datos y llamar una API no puede reservar una sesion de "
        "kinesiologia, verificar el estado de reembolso de una ISAPRE ni enrutar una "
        "derivacion a un especialista — porque no existe un protocolo estandar para que los "
        "agentes interactuen con proveedores de servicios.", S["body"]))
    elems.append(Paragraph(
        "<b>La brecha no es la capacidad de la IA. Es la ausencia de una capa de "
        "interoperabilidad de servicios.</b>",
        ParagraphStyle("emph", fontName="Helvetica-Bold", fontSize=10.5, leading=16,
            textColor=ACCENT, spaceAfter=10, spaceBefore=4)))

    gap_data = [
        ["Protocolo", "Que resuelve", "Que le falta"],
        ["MCP (Anthropic)", "Invocacion de herramientas desde agentes IA", "Semantica de dominio de servicios, consentimiento, facturacion"],
        ["A2A (Google)", "Delegacion de tareas agente a agente", "Descubrimiento de servicios, flujos financieros, datos del paciente"],
        ["CalDAV / iCal", "Interoperabilidad de calendarios", "Acceso nativo para agentes, autenticacion, contexto clinico"],
        ["HL7 / FHIR", "Intercambio de datos clinicos", "Agendamiento, facturacion, interoperabilidad con agentes"],
    ]
    elems.append(make_table(gap_data, [avail*0.18, avail*0.36, avail*0.46]))
    elems.append(Spacer(1, 6))
    elems.append(Paragraph(
        "Servicialo llena la brecha entre la infraestructura de agentes IA (MCP, A2A) "
        "y la ejecucion real de servicios profesionales.", S["body"]))

    # ── Seccion 2 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "2", "Descripcion del Protocolo")
    elems.append(Paragraph("Servicialo define:", S["body"]))
    for b in [
        "Una <b>capa de descubrimiento</b> — como los agentes encuentran organizaciones de servicios y sus capacidades",
        "Un <b>catalogo de herramientas</b> — 35 tools MCP estandarizados que cualquier implementacion compatible expone",
        "Un <b>modelo de acceso</b> — tres niveles que gobiernan lo que los agentes pueden hacer sin, con y mas alla de la autenticacion estandar",
        "Un <b>modelo de delegacion</b> — como los humanos otorgan a los agentes mandatos acotados para actuar en su nombre",
        "Una <b>capa de interoperabilidad</b> — integracion A2A v0.3 para orquestacion multi-agente",
        "Un <b>modelo financiero</b> — como se gestionan pagos, reembolsos e inclusion financiera a nivel de protocolo",
    ]:
        elems.append(Paragraph(f"• {b}", S["bullet"]))
    elems.append(Spacer(1, 8))

    elems.append(Paragraph("2.1  Historial de versiones", S["h2"]))
    vh_data = [
        ["Version", "Cambio principal"],
        ["0.1", "Schema de intenciones de reserva inicial"],
        ["0.2", "Catalogo MCP (20 herramientas), A2A basico"],
        ["0.6", "Resolucion DNS, whitepaper publicado"],
        ["0.8", "Borrador ServiceMandate, flujos financieros"],
        ["0.9  *", "Acceso 3 niveles, Agencia Delegada, A2A v0.3, 35 tools, inclusion financiera"],
    ]
    elems.append(make_table(vh_data, [avail*0.15, avail*0.85]))

    # ── Seccion 3 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "3", "Principios Fundamentales")
    principles = [
        ("1", "Interoperabilidad por defecto",
         "Cualquier agente compatible debe poder interactuar con cualquier organizacion "
         "de servicios compatible sin acuerdos de integracion bilaterales. El protocolo es el contrato."),
        ("2", "Autoridad humana, ejecucion del agente",
         "Los agentes actuan; los humanos autorizan. Ninguna accion agentica que afecte "
         "la salud, las finanzas o el estado legal de una persona puede proceder sin un "
         "mandato humano trazable. El Modelo de Agencia Delegada (Sec. 10) formaliza este principio."),
        ("3", "Divulgacion progresiva",
         "Las capacidades publicas son descubribles sin autenticacion. Las operaciones "
         "sensibles requieren senales de autorizacion progresivamente mas fuertes. "
         "El Modelo de Acceso en 3 Niveles (Sec. 4) implementa este principio."),
        ("4", "Auditabilidad",
         "Cada accion consecuente — reserva, pago, nota clinica, derivacion — debe "
         "producir un registro auditable. Las herramientas estan disenadas para emitir "
         "eventos de auditoria estructurados, no solo exito/fracaso."),
        ("5", "Soberania financiera",
         "El protocolo no prescribe un proveedor de pagos. Las organizaciones pueden aceptar "
         "transferencias bancarias, pagos con tarjeta, vouchers FONASA o cualquier otro "
         "mecanismo. Los flujos financieros son ciudadanos de primera clase del protocolo."),
        ("6", "Privacidad clinica por defecto",
         "Al gestionar datos clinicos, la postura de privacidad mas restrictiva debe ser "
         "la opcion predeterminada. Los agentes no reciben informacion clinica para la "
         "que no hayan sido explicitamente autorizados, independientemente de su nivel de autenticacion."),
        ("7", "Inteligencia colectiva como bien comun",
         "Las interacciones de servicios generan inteligencia agregada. Las implementaciones "
         "que participan en el registro acuerdan contribuir senales agregadas anonimizadas "
         "al bien comun. Sin datos individuales de pacientes. "
         "La inteligencia es colectiva; la privacidad es absoluta."),
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

    # ── Seccion 4 ─────────────────────────────────────────────────────────────
    elems += section_header(S, "4", "Modelo de Acceso en 3 Niveles")
    elems.append(Paragraph(
        "Las versiones anteriores de Servicialo trataban la autenticacion como binaria. "
        "La version 0.9 formaliza un modelo de tres niveles que se mapea con claridad "
        "a los patrones de autorizacion del mundo real.", S["body"]))

    tiers = [
        ("Nivel 0", "Publico", "Sin credenciales", colors.HexColor("#4F46E5"),
         "10 herramientas publicas — cualquier agente puede invocarlas sin credenciales. "
         "Habilita descubrimiento, formacion de intenciones y consultas preliminares de agenda.",
         [["Herramienta", "Proposito"],
          ["resolve.lookup", "Resuelve slug de org a endpoints y nivel de confianza"],
          ["resolve.search", "Busca orgs registradas por pais y vertical"],
          ["trust.get_score", "Obtiene puntuacion de confianza de la org (0-100)"],
          ["registry.search", "Busca orgs por vertical, ubicacion, pais"],
          ["registry.get_organization", "Obtiene detalles publicos de la org"],
          ["registry.manifest", "Obtiene manifiesto del servidor y endpoints disponibles"],
          ["services.list", "Lista catalogo publico de servicios de una org"],
          ["scheduling.check_availability", "Consulta slots disponibles (scheduler 3 variables)"],
          ["a2a.get_agent_card", "Obtiene Agent Card A2A para descubrimiento entre agentes"],
          ["docs.quickstart", "Guia completa de inicio como datos estructurados"]]),
        ("Nivel 1", "Autenticado", "API Key o OAuth", colors.HexColor("#0369A1"),
         "25 herramientas autenticadas — requieren autenticacion de nivel cliente. "
         "Ejecutan reservas, gestionan registros de clientes y operaciones financieras.",
         [["Herramienta (seleccion)", "Proposito"],
          ["scheduling.book / confirm", "Crear y confirmar reserva"],
          ["scheduling.reschedule / cancel", "Reagendar o cancelar con politica"],
          ["lifecycle.get_state / transition", "Consultar estado y ejecutar transicion con evidencia"],
          ["delivery.checkin / checkout", "Registrar llegada/salida con GPS + timestamp"],
          ["delivery.record_evidence", "Registrar prueba de entrega por vertical"],
          ["documentation.create", "Generar registro formal del servicio"],
          ["payments.create_sale / record_payment", "Herramientas de liquidacion financiera"],
          ["resource.list / get / create / update", "Gestion de recursos fisicos"],
          ["clients.get_or_create", "Resolver o crear identidad de cliente"],
          ["resolve.register / update_endpoint", "Registro y portabilidad de org"]]),
        ("Nivel 2", "Delegado", "ServiceMandate requerido", colors.HexColor("#7C3AED"),
         "Las herramientas de Nivel 2 requieren un objeto ServiceMandate (Sec. 10) "
         "ademas de las credenciales de Nivel 1. Se ejecutan en nombre de una persona u "
         "organizacion con autorizacion explicita, acotada y con limite de tiempo.",
         [["Herramienta", "Proposito"],
          ["servicialo_mandate_book", "Reservar usando autoridad delegada"],
          ["servicialo_mandate_pay", "Ejecutar pago con mandato"],
          ["servicialo_bulk_reschedule", "Reagendar multiples sesiones"],
          ["servicialo_discharge_client", "Cerrar plan de tratamiento activo"],
          ["servicialo_create_consent_record", "Registrar consentimiento informado firmado"],
          ["servicialo_export_clinical_record", "Exportar ficha del paciente (PDF)"],
          ["servicialo_audit_log", "Consultar registro completo de auditoria"],
          ["servicialo_revoke_mandate", "Revocar ServiceMandate activo"]]),
    ]

    for tier_id, tier_name, auth_req, color, desc, tool_rows in tiers:
        th_data = [[Paragraph(f"<b>{tier_id} - {tier_name}</b>  |  {auth_req}",
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

    # ── Seccion 5 — 8 dimensiones ──────────────────────────────────────────────
    elems += section_header(S, "5", "Las 8 Dimensiones del Servicio")
    elems.append(Paragraph(
        "Todo servicio profesional se modela con exactamente 8 dimensiones. "
        "Los agentes IA y los humanos deben comprender estas dimensiones para "
        "coordinar, verificar y liquidar un servicio.", S["body"]))

    dims = [
        ("1", "Que", "La actividad o resultado que se entrega", "Sesion de kinesiologia / Reparacion electrica / Consultoria legal"),
        ("2", "Quien entrega", "El proveedor de servicios", "Kinesiologo certificado / Abogado tributario / Terapeuta"),
        ("3", "Quien recibe", "El cliente beneficiario (el pagador puede ser distinto)", "Paciente (paga FONASA) / Empleado (paga la empresa)"),
        ("4", "Cuando", "Ventana temporal acordada", "2026-04-10 de 10:00 a 10:45"),
        ("5", "Donde", "Lugar fisico o virtual, incluyendo recursos fisicos", "Clinica / Box 3 / Domicilio / Videollamada"),
        ("6", "Ciclo de vida", "Posicion actual en los 9 estados universales", "Confirmado — siguiente: En curso"),
        ("7", "Evidencia", "Como se demuestra la entrega", "GPS + duracion + firma del cliente + nota clinica"),
        ("8", "Cobro", "Liquidacion financiera con estado independiente", "$35.000 CLP - cobrado - paquete prepagado"),
    ]
    dim_data = [["#", "Dimension", "Descripcion", "Ejemplo"]]
    dim_data += [[n, d, desc, ex] for n, d, desc, ex in dims]
    elems.append(make_table(dim_data, [avail*0.05, avail*0.18, avail*0.37, avail*0.40]))

    # ── Seccion 6 — 9 estados ─────────────────────────────────────────────────
    elems += section_header(S, "6", "9 Estados Universales del Ciclo de Vida")
    elems.append(Paragraph(
        "Todo servicio profesional recorre exactamente 9 estados, sin importar el tipo. "
        "Los estados son estrictamente ordenados y no pueden saltarse.", S["body"]))

    states = [
        ("1", "Solicitado", "El cliente o agente define que, cuando y donde"),
        ("2", "Agendado", "Fecha, hora y proveedor asignados; slots bloqueados en ambos calendarios"),
        ("3", "Confirmado", "Ambas partes confirmadas; recordatorios programados; prerrequisitos verificados"),
        ("4", "En Curso", "Sesion en progreso; check-in detectado; servicio siendo entregado"),
        ("5", "Completado", "Sesion terminada; hecho operativo; evidencia capturada"),
        ("6", "Documentado", "Evidencia registrada (ficha clinica, informe de trabajo, acta por vertical)"),
        ("7", "Facturado", "Documento tributario emitido (boleta o factura segun regulacion local)"),
        ("8", "Cobrado", "Pago recibido y confirmado (debito prepagado, transferencia, reembolso seguro)"),
        ("9", "Verificado", "Cliente confirma o auto-verifica tras ventana de silencio; ciclo cerrado"),
    ]
    st_data = [["#", "Estado", "Descripcion"]]
    st_data += list(states)
    elems.append(make_table(st_data, [avail*0.05, avail*0.20, avail*0.75]))
    elems.append(Spacer(1, 8))
    elems.append(Paragraph(
        "<b>Por que 9 estados?</b> Menos estados pierden informacion critica: sin separar "
        "\"Completado\" de \"Documentado\", no se puede distinguir \"el proveedor dice que "
        "ocurrio\" de \"la evidencia esta registrada\". Sin separar \"Cobrado\" de "
        "\"Verificado\", no se sabe si el cliente acepto el resultado. 9 es el minimo viable "
        "para que los agentes IA verifiquen con certeza la cadena completa.",
        S["body_muted"]))

    # ── Seccion 7 — 6 excepciones ─────────────────────────────────────────────
    elems += section_header(S, "7", "6 Flujos de Excepcion")
    elems.append(Paragraph(
        "Las excepciones no son casos borde — ocurren en el 15-30% de todas las citas. "
        "Servicialo las modela como transiciones de estado de primera clase, no como "
        "casos especiales.", S["body"]))

    exceps = [
        ("1", "Inasistencia del cliente", "Confirmado → Cancelado / Reasignado", "Politica de penalizacion aplicada; slot liberado"),
        ("2", "Inasistencia del proveedor", "Confirmado → Reasignando proveedor", "Sistema busca reemplazo o reagenda con nuevo proveedor"),
        ("3", "Cancelacion", "Preentrega → Cancelado", "Politica de cancelacion aplicada segun tiempo restante"),
        ("4", "Disputa de calidad", "Completado → Disputado", "Cobro congelado; evidencia solicitada; resolucion 80/20"),
        ("5", "Reagendamiento", "Agendado → Reagendando → Agendado", "Nuevo slot compatible para ambas partes"),
        ("6", "Servicio parcial", "En Curso → Parcial", "Documenta lo entregado; ajusta facturacion proporcionalmente"),
    ]
    ex_data = [["#", "Excepcion", "Transicion", "Resultado"]]
    ex_data += list(exceps)
    elems.append(make_table(ex_data, [avail*0.05, avail*0.25, avail*0.30, avail*0.40]))

    # ── Seccion 8 — 7 principios ──────────────────────────────────────────────
    elems += section_header(S, "8", "7 Principios del Estandar")
    principles_summary = [
        ("1", "Todo servicio tiene un ciclo", "9 estados son universales, desde masaje hasta auditoria"),
        ("2", "La entrega debe ser verificable", "Si no puedes probar que ocurrio el servicio, no ocurrio"),
        ("3", "El pagador no siempre es el cliente", "Seguro paga en salud; empresa paga en servicios corporativos"),
        ("4", "Las excepciones son la regla", "No-shows, cancelaciones, disputas — 15-30% de citas"),
        ("5", "Un servicio es un producto legible por maquinas", "Los agentes pueden descubrir, coordinar y cerrar con certeza"),
        ("6", "El acuerdo es separado de la entrega", "Orden de Servicio (acordado) distinto del Servicio atomico (entregado)"),
        ("7", "La inteligencia colectiva es un bien comun", "Cada nodo contribuye y todos navegan mejor — como Waze"),
    ]
    pr_data = [["#", "Principio", "En una linea"]]
    pr_data += list(principles_summary)
    elems.append(make_table(pr_data, [avail*0.05, avail*0.38, avail*0.57]))

    # ── Seccion 9 — DNS ────────────────────────────────────────────────────────
    elems += section_header(S, "9", "Sistema de Resolucion DNS")
    elems.append(Paragraph(
        "El Resolver DNS de Servicialo proporciona una cadena de descubrimiento "
        "estandarizada para que los agentes localicen organizaciones, verifiquen "
        "cumplimiento del protocolo y resuelvan la topologia de endpoints — sin "
        "conocimiento previo ni URLs hardcodeadas.", S["body"]))

    elems.append(Paragraph("9.1  Cadena de resolucion", S["h2"]))
    elems.append(CodeBlock(
"""Consulta del agente
    |
    v
Fase 0: Lookup en el registro
    servicialo.com/.well-known/agents.json
    -> Retorna: [orgSlug, dominio, protocolVersion, capacidades]
    |
    v
Fase 1: Resolucion del Agent Card
    {dominio}/.well-known/agent.json
    -> Retorna: A2A card + extension x-servicialo + endpoints
    |
    v
Fase 2: Negociacion de capacidades
    Consulta lista de tools MCP (Nivel 0 - sin auth)
    -> Retorna: Herramientas disponibles y requisitos de acceso
    |
    v
Fase 3: Envio de intencion
    Invocacion de herramienta con credenciales del nivel apropiado"""))

    elems.append(Paragraph("9.2  6 Herramientas de resolucion", S["h2"]))
    res_data = [
        ["Herramienta", "Fase", "Proposito"],
        ["resolve.lookup", "0", "Busca org por slug; retorna endpoints + nivel de confianza"],
        ["resolve.search", "0", "Busca orgs registradas por pais y vertical"],
        ["trust.get_score", "0", "Puntuacion de confianza — acumulacion pasiva desde historial de entregas"],
        ["registry.manifest", "1", "Manifiesto del servidor: capacidades, version, endpoints"],
        ["registry.get_organization", "1", "Detalles de org con servicios, proveedores, config de reserva"],
        ["resolve.register", "2", "Registra nueva org en el resolver global con slug portable unico"],
    ]
    elems.append(make_table(res_data, [avail*0.30, avail*0.10, avail*0.60]))

    elems.append(Paragraph("9.3  Extension x-servicialo", S["h2"]))
    elems.append(Paragraph(
        "Todo Agent Card compatible con Servicialo debe incluir el bloque "
        "<b>x-servicialo</b>. Esto le da a cualquier agente externo — de Google ADK, "
        "Salesforce Agentforce o cualquier sistema compatible A2A — todo lo necesario "
        "para iniciar una interaccion de servicios con un solo HTTP GET.", S["body"]))
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

    # ── Seccion 10 — Agencia Delegada ──────────────────────────────────────────
    elems += section_header(S, "10", "Modelo de Agencia Delegada")
    elems.append(Paragraph(
        "El Modelo de Agencia Delegada es el mecanismo por el cual los agentes IA "
        "obtienen autoridad para actuar en nombre de una persona u organizacion "
        "para un conjunto acotado de operaciones.", S["body"]))

    elems.append(Paragraph("10.1  ServiceMandate", S["h2"]))
    elems.append(Paragraph(
        "Un <b>ServiceMandate</b> es un objeto de autorizacion firmado y estructurado:", S["body"]))
    elems.append(CodeBlock(
"""{
  "mandateId": "mnd_01J...",
  "issuer": {
    "type": "human",
    "id": "cliente_xyz",
    "name": "Maria Gonzalez"
  },
  "agent": {
    "id": "agente_abc",
    "name": "HealthBot Pro",
    "implementer": "acme-health-app"
  },
  "scope": {
    "tools": ["servicialo_mandate_book", "servicialo_reschedule"],
    "services": ["kinesiologia"],
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

    elems.append(Paragraph("10.2  Ciclo de vida del mandato", S["h2"]))
    elems.append(CodeBlock(
"""El humano crea el mandato (en la app o via solicitud del agente)
    |
    v
Mandato almacenado en la org compatible con Servicialo
    |
    v
El agente presenta mandateId + credenciales Nivel 1 en cada llamada Nivel 2
    |
    v
La org valida: alcance, validez, presupuesto restante
    |
    +-- Valido   --> ejecuta + decrementa uso del mandato
    +-- Invalido --> rechaza + emite evento de auditoria
    |
    v
El humano puede revocar en cualquier momento via servicialo_revoke_mandate"""))

    elems.append(Paragraph(
        "El Modelo de Agencia Delegada hace que los agentes basados en Servicialo "
        "sean juridica y operativamente confiables. Una clinica puede permitir que una "
        "plataforma de gestion de salud reserve autonomamente sesiones de seguimiento — "
        "acotadas por la autorizacion explicita del paciente, visible en el registro de "
        "auditoria, revocable en cualquier momento.", S["body"]))

    # ── Seccion 11 — A2A ───────────────────────────────────────────────────────
    elems += section_header(S, "11", "Interoperabilidad A2A v0.3")
    elems.append(Paragraph(
        "Servicialo v0.9 adopta <b>A2A v0.3</b> como capa de interoperabilidad "
        "multi-agente. A2A (protocolo Agente-a-Agente, originado por Google, "
        "mantenido por la Linux Foundation) permite que agentes de distintos sistemas "
        "intercambien tareas a traves de un formato de mensaje estandarizado.",
        S["body"]))

    a2a_data = [
        ["Caracteristica", "v0.2", "v0.3"],
        ["Endpoint de tarea", "tasks/send", "message/send"],
        ["Campo de tipo de parte", "type", "kind"],
        ["Extension Servicialo", "No especificada", "Bloque x-servicialo requerido"],
        ["Version de protocolo", "No declarada", "protocol_version en todos los mensajes"],
    ]
    elems.append(make_table(a2a_data, [avail*0.35, avail*0.25, avail*0.40]))
    elems.append(Spacer(1, 10))

    elems.append(Paragraph("Ejemplo de flujo de reserva (A2A v0.3)", S["h2"]))
    elems.append(CodeBlock(
"""POST /api/servicialo/{orgSlug}/a2a
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "message/send",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        {
          "kind": "text",
          "text": "Reservar kinesiologia para Maria Gonzalez el martes siguiente en la tarde"
        }
      ]
    }
  }
}"""))

    # ── Seccion 12 — Genesis ───────────────────────────────────────────────────
    elems += section_header(S, "12", "Habilidades Genesis del Agente")
    elems.append(Paragraph(
        "Genesis define las cinco capacidades agenticas fundamentales que una "
        "implementacion compatible debe demostrar para considerarse lista para produccion.",
        S["body"]))

    skills = [
        ("1", "Descubrimiento autonomo",
         "El agente localiza una org de servicios, resuelve sus capacidades y determina "
         "si puede satisfacer una necesidad — sin ninguna configuracion hardcodeada.",
         "resolve.lookup -> registry.get_organization -> services.list -> scheduling.check_availability", ""),
        ("2", "Reserva de extremo a extremo",
         "Completa un ciclo completo de reserva: consulta de disponibilidad -> seleccion de slot "
         "-> confirmacion de reserva -> registro de pago — en una sesion autonoma.",
         "scheduling.check_availability -> scheduling.book -> scheduling.confirm -> payments.create_sale",
         "Verificado en produccion (Coordinalo, Marzo 2026)"),
        ("3", "Continuidad de contexto clinico",
         "Lee el historial del paciente, plan de tratamiento activo y notas de sesiones "
         "anteriores antes de reservar — e incluye contexto clinico en el registro.",
         "clients.get_or_create -> lifecycle.get_state -> documentation.create -> scheduling.book", ""),
        ("4", "Derivacion inter-organizacional",
         "Descubre una org especialista, valida su capacidad, inicia una derivacion con "
         "token de consentimiento y hace seguimiento del resultado — entre dos impls. independientes.",
         "registry.search -> servicialo_initiate_referral -> servicialo_get_referral_status", ""),
        ("5", "Conciliacion financiera",
         "Identifica pagos entrantes sin conciliar, resuelve el mapeo mas probable al "
         "cliente usando patrones historicos, y marca pagos como conciliados o los "
         "escala para revision humana.",
         "payments.get_status -> payments.record_payment -> motor de conciliacion", ""),
    ]

    for num, title, desc, tools_used, status in skills:
        bg = ACCENT_LT if num == "2" else colors.HexColor("#F8FAFC")
        sk_data = [[
            Paragraph(f"<b>{num}</b>", ParagraphStyle("skn", fontName="Helvetica-Bold",
                fontSize=14, textColor=ACCENT, leading=18)),
            [
                Paragraph(f"<b>Habilidad {num} — {title}</b>" + (
                    f" <font color='#16A34A' size='8'>  VERIFICADO EN PRODUCCION</font>" if status else ""),
                    ParagraphStyle("skt", fontName="Helvetica-Bold", fontSize=10,
                        textColor=INK, leading=14, spaceAfter=3)),
                Paragraph(desc, S["body_muted"]),
                Paragraph(f"<i>Herramientas: {tools_used}</i>",
                    ParagraphStyle("sktl", fontName="Helvetica-Oblique", fontSize=8,
                        textColor=MUTED, leading=12, spaceBefore=2)),
            ],
        ]]
        skt = Table(sk_data, colWidths=[avail*0.06, avail*0.94])
        skt.setStyle(TableStyle([
            ("BACKGROUND",   (0,0),(-1,-1), bg),
            ("LINEBELOW",    (0,0),(-1,-1), 0.5, ACCENT if num=="2" else RULE),
            ("VALIGN",       (0,0),(-1,-1), "TOP"),
            ("TOPPADDING",   (0,0),(-1,-1), 8),
            ("BOTTOMPADDING",(0,0),(-1,-1), 8),
            ("LEFTPADDING",  (0,0),(0,0), 10),
        ]))
        elems.append(skt)
        elems.append(Spacer(1, 4))

    # ── Seccion 13 — Inclusion financiera ─────────────────────────────────────
    elems += section_header(S, "13", "Inclusion Financiera")
    elems.append(Paragraph(
        "<b>La inclusion financiera no es una caracteristica. Es una restriccion de diseno.</b>",
        ParagraphStyle("fi_emph", fontName="Helvetica-Bold", fontSize=11,
            textColor=ACCENT, leading=16, spaceAfter=10)))
    elems.append(Paragraph(
        "Servicialo v0.9 formaliza esta restriccion con tres requisitos a nivel de "
        "protocolo para las implementaciones compatibles:", S["body"]))

    for sec, title, desc in [
        ("13.1", "Soporte multi-modalidad de pago",
         "Las implementaciones compatibles deben soportar al menos tres modalidades de pago: "
         "tarjeta, transferencia bancaria y una opcion de subsidio publico (FONASA en Chile, "
         "o seguro nacional equivalente en otras jurisdicciones)."),
        ("13.2", "Integracion FONASA / Seguro publico",
         "El protocolo define un campo codigoPrestacion en las definiciones de servicio — "
         "el codigo de facturacion requerido para los reclamos de reembolso FONASA en Chile. "
         "Este campo es de primera clase en el schema del servicio, no una extension."),
        ("13.3", "Modelos de pago parcial y saldo",
         "Los pacientes reales en condiciones economicas reales hacen pagos parciales. "
         "El modelo financiero de Servicialo soporta saldos pendientes entre sesiones, "
         "registro de pagos parciales, definicion de planes de pago y flujos de cobranza "
         "como nativos del protocolo, no especificos de la implementacion."),
    ]:
        elems.append(Paragraph(f"{sec}  {title}", S["h2"]))
        elems.append(Paragraph(desc, S["body"]))

    elems.append(Paragraph(
        "Un protocolo de agendamiento que solo funciona para pacientes que pueden pagar "
        "con tarjeta al momento de la reserva sirve a una fraccion de la poblacion que "
        "necesita atencion de salud. El protocolo codifica la realidad economica "
        "de los mercados en los que opera.", S["body_muted"]))

    # ── Seccion 14 — Coordinalo ────────────────────────────────────────────────
    elems += section_header(S, "14", "Implementacion de Referencia: Coordinalo")
    elems.append(Paragraph(
        "Coordinalo es la <b>implementacion de referencia verificada</b> del protocolo "
        "Servicialo. Cada caracteristica del protocolo descrita en este documento existe "
        "en produccion en coordinalo.com.", S["body"]))

    impl_data = [
        ["Caracteristica del protocolo", "Estado en Coordinalo"],
        ["35 tools MCP (10 publicas + 25 autenticadas)", "Live en /api/mcp"],
        ["Modelo de Acceso en 3 Niveles", "API key + sistema de mandatos — Live"],
        ["ServiceMandate (Agencia Delegada)", "Implementado"],
        ["Interoperabilidad A2A v0.3", "Live en /api/servicialo/{orgSlug}/a2a"],
        ["Extension x-servicialo en agent card", "Live en /.well-known/agent.json"],
        ["Resolucion DNS (6 herramientas)", "Live — servicialo.com/.well-known/agents.json"],
        ["Habilidades Genesis 1-2", "Verificadas en produccion"],
        ["Habilidades Genesis 3-5", "En progreso"],
        ["Codigos de facturacion FONASA", "En progreso"],
        ["Modulo de consentimiento informado", "Planificado"],
        ["Exportacion de ficha clinica PDF", "Planificado"],
    ]
    elems.append(make_table(impl_data, [avail*0.60, avail*0.40]))
    elems.append(Spacer(1, 10))
    elems.append(Paragraph(
        "<b>Mama Pro</b> (slug: mamapro) — una clinica de kinesiologia en salud de la mujer "
        "en Santiago, Chile — es el despliegue de referencia en produccion del protocolo. "
        "Todas las validaciones de habilidades Genesis se realizan contra este "
        "despliegue en vivo.", S["body_muted"]))

    # ── Seccion 15 — Ecosistema ────────────────────────────────────────────────
    elems += section_header(S, "15", "Ecosistema y Registro")
    elems.append(Paragraph(
        "El registro publico en <b>https://servicialo.com/.well-known/agents.json</b> "
        "lista todas las implementaciones compatibles verificadas. Para aparecer en el "
        "registro se requiere:", S["body"]))
    for b in [
        "Un /.well-known/agent.json valido con la extension x-servicialo",
        "Respuesta exitosa a las 10 herramientas publicas de Nivel 0",
        "Version de protocolo 0.8 o superior",
        "Al menos una Habilidad Genesis demostrada en un entorno de staging",
    ]:
        elems.append(Paragraph(f"• {b}", S["bullet"]))
    elems.append(Spacer(1, 10))
    elems.append(Paragraph("Paquete npm", S["h2"]))
    elems.append(CodeBlock("npm install @servicialo/mcp-server"))
    elems.append(Paragraph(
        "El paquete @servicialo/mcp-server provee un servidor MCP listo para usar que "
        "cualquier organizacion de servicios puede embeber. Maneja routing y validacion "
        "de herramientas, control de acceso por nivel, validacion de mandatos y "
        "emision de eventos de auditoria.", S["body"]))

    # ── Seccion 16 — Roadmap ───────────────────────────────────────────────────
    elems += section_header(S, "16", "Hoja de Ruta")
    for ver, items in [
        ("v1.0 — Q3 2026 — Protocolo estable", [
            "Congelar catalogo de herramientas",
            "Suite formal de pruebas de cumplimiento",
            "Codigos financieros multi-pais (Colombia, Brasil, Mexico)",
            "Verificacion criptografica de mandatos",
            "Segunda implementacion de referencia verificada (no Coordinalo)",
        ]),
        ("v1.1 — Q4 2026", [
            "Presencia en tiempo real del agente (notificacion cuando gestiona activamente una reserva)",
            "API de inteligencia agregada (senales anonimizadas entre orgs, Principio 7)",
            "Exportacion FHIR nativa desde notas clinicas",
        ]),
        ("v2.0 — 2027", [
            "Gestion autonoma completa del ciclo de vida de tratamiento",
            "Flujos de derivacion entre paises",
            "Registro descentralizado de mandatos",
        ]),
    ]:
        elems.append(Paragraph(ver, S["h2"]))
        for item in items:
            elems.append(Paragraph(f"• {item}", S["bullet"]))
        elems.append(Spacer(1, 4))

    # ── Seccion 17 — Conclusion ────────────────────────────────────────────────
    elems += section_header(S, "17", "Conclusion")
    elems.append(Paragraph(
        "Servicialo v0.9 es el primer protocolo abierto que trata la orquestacion "
        "de servicios nativa para IA — no como una extension de las APIs de reserva "
        "existentes, sino como el objetivo principal de diseno.", S["body"]))
    elems.append(Paragraph(
        "Los tres avances de esta version — el Modelo de Acceso en 3 Niveles, el Modelo "
        "de Agencia Delegada y la interoperabilidad A2A v0.3 — juntos hacen una "
        "afirmacion sustantiva: que los agentes IA pueden ser confiables en interacciones "
        "de servicios consecuentes cuando el protocolo hace cumplir la autoridad humana, "
        "mandatos acotados y registros de auditoria completos.", S["body"]))
    elems.append(Paragraph(
        "El protocolo no es teorico. Coordinalo lo ejecuta en produccion. Mama Pro "
        "agenda pacientes reales con el. La Habilidad Genesis 2 — la primera reserva "
        "autonoma de extremo a extremo — se ha ejecutado en un entorno en vivo.", S["body"]))

    conclusion_data = [["Servicialo es ese estandar."]]
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

    # ── Apendice A ─────────────────────────────────────────────────────────────
    elems.append(PageBreak())
    elems += section_header(S, "Apend. A", "Catalogo Completo de Herramientas")
    elems.append(Paragraph(
        "35 herramientas en 3 niveles. Herramientas 1-10: publicas (Nivel 0). "
        "Herramientas 11-35: requieren autenticacion (Nivel 1) o ServiceMandate (Nivel 2).",
        S["body_muted"]))

    tools_data = [["#", "Herramienta", "Nivel", "Dominio"]]
    tools = [
        ("1","resolve.lookup","0","DNS"),
        ("2","resolve.search","0","DNS"),
        ("3","trust.get_score","0","Confianza"),
        ("4","registry.search","0","Descubrimiento"),
        ("5","registry.get_organization","0","Descubrimiento"),
        ("6","registry.manifest","0","Descubrimiento"),
        ("7","services.list","0","Descubrimiento"),
        ("8","scheduling.check_availability","0","Agenda"),
        ("9","a2a.get_agent_card","0","A2A"),
        ("10","docs.quickstart","0","Docs"),
        ("11","service.get","1","Servicios"),
        ("12","contract.get","1","Servicios"),
        ("13","clients.get_or_create","1","CRM"),
        ("14","scheduling.book","1","Reservas"),
        ("15","scheduling.confirm","1","Reservas"),
        ("16","lifecycle.get_state","1","Ciclo de vida"),
        ("17","lifecycle.transition","1","Ciclo de vida"),
        ("18","scheduling.reschedule","1","Reservas"),
        ("19","scheduling.cancel","1","Reservas"),
        ("20","delivery.checkin","1","Entrega"),
        ("21","delivery.checkout","1","Entrega"),
        ("22","delivery.record_evidence","1","Entrega"),
        ("23","documentation.create","1","Docs"),
        ("24","payments.create_sale","1","Finanzas"),
        ("25","payments.record_payment","1","Finanzas"),
        ("26","payments.get_status","1","Finanzas"),
        ("27","resource.list","1","Recursos"),
        ("28","resource.get","1","Recursos"),
        ("29","resource.create","1","Recursos"),
        ("30","resource.update","1","Recursos"),
        ("31","resource.delete","1","Recursos"),
        ("32","resource.get_availability","1","Recursos"),
        ("33","resolve.register","1","DNS"),
        ("34","resolve.update_endpoint","1","DNS"),
        ("35","telemetry.heartbeat","1","Telemetria"),
    ]
    tools_data += [list(t) for t in tools]
    elems.append(make_table(tools_data, [avail*0.06, avail*0.47, avail*0.10, avail*0.37]))

    # ── Apendice B ─────────────────────────────────────────────────────────────
    elems.append(Spacer(1, 18))
    elems += section_header(S, "Apend. B", "Comparativa con Versiones Anteriores")

    comp_data = [
        ["Dimension", "v0.6", "v0.9"],
        ["Herramientas MCP", "20", "35 (10 publicas + 25 autenticadas)"],
        ["Principios fundamentales", "6", "7 (+ inteligencia colectiva como bien comun)"],
        ["Flujos de excepcion", "7", "6 (reclasificados)"],
        ["Version A2A", "0.2 (basica)", "0.3 (extension x-servicialo requerida)"],
        ["Modelo de delegacion", "Ninguno", "ServiceMandate (Nivel 2)"],
        ["Niveles de acceso", "Binario (auth/no-auth)", "Nivel 0 / Nivel 1 / Nivel 2"],
        ["Resolucion DNS", "Borrador", "Fase 0 con 6 herramientas de resolucion"],
        ["Inclusion financiera", "No abordada", "Restriccion de diseno a nivel de protocolo"],
        ["Habilidades Genesis", "No definidas", "5 habilidades — Habilidad 2 verificada en prod"],
        ["Listado en registro", "No requerido", "Requerido para estado verificado"],
        ["Extension agent card", "Ninguna", "Bloque x-servicialo (implementador + endpoints)"],
    ]
    elems.append(make_table(comp_data, [avail*0.32, avail*0.24, avail*0.44]))

    elems.append(Spacer(1, 20))
    footer_data = [[
        "Servicialo es un protocolo abierto publicado bajo la licencia Apache 2.0.\n"
        "Coordinalo es la implementacion de referencia. Mama Pro es el despliegue de referencia en produccion.\n"
        "github.com/servicialo  -  servicialo.com  -  coordinalo.com"
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
        subject="Estandar abierto para la coordinacion de servicios profesionales",
        creator="@servicialo/mcp-server",
    )

    story = []
    story += cover_page(S)
    story += toc(S)
    story += body_content(S)

    doc.build(story, onFirstPage=on_cover_page, onLaterPages=on_normal_page)
    print(f"PDF ES generado: {output_path}")


if __name__ == "__main__":
    build()
