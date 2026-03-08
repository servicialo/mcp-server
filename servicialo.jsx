import { useState } from "react";

const C = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F3EF",
  border: "#E8E4DD",
  borderLight: "#F0EDE7",
  text: "#1A1A18",
  textBody: "#3D3D3A",
  textMuted: "#8A8780",
  textDim: "#B0ADA6",
  accent: "#E8590C",
  accentSoft: "#FFF1EB",
  accentDark: "#C24B0A",
  green: "#2B8A3E",
  greenSoft: "#EBFBEE",
  blue: "#1971C2",
  blueSoft: "#E7F5FF",
  purple: "#7048C6",
  purpleSoft: "#F3F0FF",
  dark: "#1A1A18",
  darkSoft: "#2C2C29",
};

const SERVICE_ORIGINS = [
  {
    id: "asset",
    emoji: "🏠",
    title: "Desde un Activo",
    subtitle: "Tienes algo que otros necesitan",
    color: C.blue,
    colorSoft: C.blueSoft,
    desc: "Un activo es cualquier recurso que posees y que puede generar valor para otros. No necesitas hacer nada nuevo — solo facilitar acceso.",
    examples: [
      { asset: "Un departamento vacío", service: "Hospedaje temporal", ref: "Airbnb nació así" },
      { asset: "Un auto que usas 4hrs/día", service: "Transporte bajo demanda", ref: "Uber nació así" },
      { asset: "Una cocina comercial", service: "Dark kitchen para terceros", ref: "CloudKitchens" },
      { asset: "Equipamiento médico", service: "Arriendo de box clínico por hora", ref: "WeWork de salud" },
      { asset: "Un terreno", service: "Estacionamiento por hora", ref: "" },
      { asset: "Una bodega", service: "Almacenamiento on-demand", ref: "" },
    ],
    keyQuestion: "¿Qué tienes que otros necesitan temporalmente?",
    formula: "Activo subutilizado + Acceso facilitado = Servicio",
  },
  {
    id: "advantage",
    emoji: "🎯",
    title: "Desde una Ventaja",
    subtitle: "Sabes algo que otros no",
    color: C.purple,
    colorSoft: C.purpleSoft,
    desc: "Una ventaja es conocimiento, experiencia, red de contactos o habilidad que te da una posición privilegiada. El servicio emerge cuando transfieres esa ventaja a otros.",
    examples: [
      { asset: "Experiencia en tributación", service: "Asesoría tributaria", ref: "" },
      { asset: "Red de contactos en industria X", service: "Headhunting / reclutamiento", ref: "" },
      { asset: "Certificación en kinesiología", service: "Rehabilitación deportiva", ref: "Tu clínica piloto" },
      { asset: "Dominio de un idioma", service: "Traducción / interpretación", ref: "" },
      { asset: "Experiencia en marketing digital", service: "Consultoría de growth", ref: "" },
      { asset: "Conocimiento regulatorio", service: "Compliance as a service", ref: "" },
    ],
    keyQuestion: "¿Qué sabes hacer que otros pagarían por aprender o delegar?",
    formula: "Conocimiento diferencial + Aplicación práctica = Servicio",
  },
  {
    id: "time",
    emoji: "⏱️",
    title: "Desde tu Tiempo",
    subtitle: "Puedes hacer lo que otros no quieren o no pueden",
    color: C.green,
    colorSoft: C.greenSoft,
    desc: "El servicio más básico y universal: intercambiar tu tiempo y esfuerzo por valor. No necesitas un activo especial ni conocimiento diferencial — solo disponibilidad y voluntad.",
    examples: [
      { asset: "Horas disponibles + fuerza física", service: "Mudanzas / fletes", ref: "" },
      { asset: "Tiempo + atención al detalle", service: "Limpieza profesional", ref: "" },
      { asset: "Tiempo + habilidad manual", service: "Mantenimiento del hogar", ref: "" },
      { asset: "Tiempo + paciencia", service: "Cuidado de adultos mayores", ref: "" },
      { asset: "Tiempo + presencia", service: "Paseo de mascotas", ref: "" },
      { asset: "Horas nocturnas disponibles", service: "Seguridad / vigilancia", ref: "" },
    ],
    keyQuestion: "¿Qué tiempo tienes que otros necesitan?",
    formula: "Tiempo disponible + Tarea que otros evitan = Servicio",
  },
];

const LIFECYCLE_STATES = [
  { id: "requested", label: "Solicitado", icon: "1", desc: "El cliente o su agente AI define qué necesita, cuándo y dónde.", color: C.accent },
  { id: "scheduled", label: "Agendado", icon: "2", desc: "Fecha, hora y proveedor asignados. Se bloquea el horario en los calendarios de ambas partes.", color: C.accent },
  { id: "confirmed", label: "Confirmado", icon: "3", desc: "Ambas partes confirmaron el compromiso. Recordatorios programados. Prerrequisitos verificados.", color: C.accent },
  { id: "in_progress", label: "En Curso", icon: "4", desc: "Sesión en progreso. Registro de entrada detectado. El servicio está siendo entregado.", color: C.accent },
  { id: "completed", label: "Completado", icon: "5", desc: "Sesión terminó. Hecho operacional. Evidencia capturada: duración real, notas, fotos si aplica.", color: C.accent },
  { id: "documented", label: "Documentado", icon: "6", desc: "Evidencia registrada. Ficha clínica, reporte de trabajo, minuta — según la vertical.", color: C.accent },
  { id: "collected", label: "Cobrado", icon: "7", desc: "Pago recibido y confirmado. Saldo prepago debitado, transferencia acreditada o reembolso de aseguradora recibido.", color: C.accent },
  { id: "verified", label: "Verificado", icon: "8", desc: "El cliente confirma que el servicio ocurrió y fue cobrado correctamente, o se auto-verifica tras la ventana de silencio. Cierre del ciclo.", color: C.green },
];

const ANATOMY = [
  { field: "Qué", desc: "La actividad o resultado que se entrega", example: "Sesión de kinesiología / Reparación eléctrica / Consulta legal" },
  { field: "Quién entrega", desc: "El proveedor del servicio (provider)", example: "Kinesiólogo certificado / Electricista SEC / Abogado tributario" },
  { field: "Quién recibe", desc: "El beneficiario del servicio (client)", example: "Paciente / Propietario / Empresa" },
  { field: "Quién paga", desc: "No siempre es quien recibe", example: "FONASA paga por el paciente / Empresa paga por el empleado" },
  { field: "Cuándo", desc: "Ventana temporal acordada", example: "2026-02-10 de 10:00 a 10:45" },
  { field: "Dónde", desc: "Ubicación física o virtual", example: "Clínica / Domicilio / Videollamada" },
  { field: "Evidencia", desc: "Cómo se prueba que ocurrió", example: "Check-in GPS + duración + registro clínico firmado" },
  { field: "Resultado", desc: "Qué quedó como output documentado", example: "Ficha clínica / Fotos antes-después / Minuta" },
];

const PRINCIPLES = [
  { title: "Todo servicio tiene un ciclo", body: "No importa si es un masaje o una auditoría. Todo servicio se solicita, se agenda, se ejecuta, se documenta, se cobra y se verifica. Estos 8 estados son universales." },
  { title: "La entrega debe ser verificable", body: "Si no puedes probar que el servicio ocurrió, no ocurrió. Servicialo define qué constituye evidencia válida de entrega para que humanos y agentes AI puedan confiar en ella." },
  { title: "El pagador no siempre es el cliente", body: "En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El estándar separa estos tres roles: beneficiario, solicitante y pagador." },
  { title: "Las excepciones son la regla", body: "No-shows, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan. Servicialo estandariza estos flujos." },
  { title: "Un servicio es un producto", body: "Tiene un nombre, un precio, una duración, requisitos y un resultado esperado. Cuando lo defines así, cualquier agente AI puede descubrirlo, ofrecerlo y coordinarlo." },
  { title: "Los agentes AI son ciudadanos de primera clase", body: "El estándar está diseñado para que un agente AI pueda solicitar, verificar y cerrar un servicio con la misma confianza que un humano. Cada estado y transición es legible por máquina." },
];

function Section({ children, id }) {
  return (
    <div id={id} style={{ marginBottom: 64 }}>
      {children}
    </div>
  );
}

function SectionTitle({ tag, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {tag && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          color: C.accent,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 8,
        }}>
          {tag}
        </div>
      )}
      <h2 style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: 32,
        fontWeight: 400,
        color: C.text,
        margin: 0,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 16, color: C.textMuted, marginTop: 10, lineHeight: 1.6, maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function OriginCard({ origin, isExpanded, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isExpanded ? origin.colorSoft : C.surface,
        border: `1px solid ${isExpanded ? origin.color + "44" : C.border}`,
        borderRadius: 16,
        padding: isExpanded ? "24px 28px" : "20px 24px",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isExpanded ? 16 : 0 }}>
        <span style={{ fontSize: 32 }}>{origin.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text }}>{origin.title}</div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 2 }}>{origin.subtitle}</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `1.5px solid ${isExpanded ? origin.color : C.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: isExpanded ? origin.color : C.textDim,
          transform: isExpanded ? "rotate(90deg)" : "none",
          transition: "all 0.3s",
        }}>
          →
        </div>
      </div>

      {isExpanded && (
        <div>
          <p style={{ fontSize: 15, color: C.textBody, lineHeight: 1.7, marginBottom: 20 }}>
            {origin.desc}
          </p>

          {/* Key Question */}
          <div style={{
            background: C.surface,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 16,
            borderLeft: `3px solid ${origin.color}`,
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: origin.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Pregunta clave
            </div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: C.text, lineHeight: 1.4 }}>
              {origin.keyQuestion}
            </div>
          </div>

          {/* Formula */}
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            color: C.textBody,
            background: C.surfaceAlt,
            borderRadius: 8,
            padding: "12px 16px",
            textAlign: "center",
            marginBottom: 20,
            letterSpacing: "0.02em",
          }}>
            {origin.formula}
          </div>

          {/* Examples */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {origin.examples.map((ex, i) => (
              <div key={i} style={{
                background: C.surface,
                borderRadius: 10,
                padding: "12px 14px",
                border: `1px solid ${C.borderLight}`,
              }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{ex.asset}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>→ {ex.service}</div>
                {ex.ref && <div style={{ fontSize: 11, color: origin.color, marginTop: 4, fontStyle: "italic" }}>{ex.ref}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LifecycleInteractive() {
  const [active, setActive] = useState(0);
  const state = LIFECYCLE_STATES[active];

  return (
    <div style={{
      background: C.dark,
      borderRadius: 20,
      padding: "28px 32px",
      color: "#fff",
    }}>
      {/* State indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
        {LIFECYCLE_STATES.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div
              onClick={() => setActive(i)}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: i === active ? C.accent : i < active ? C.green + "33" : C.darkSoft,
                border: `2px solid ${i === active ? C.accent : i < active ? C.green : "#444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12, fontWeight: 600,
                color: i === active ? "#fff" : i < active ? C.green : "#666",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {i < active ? "✓" : s.icon}
            </div>
            {i < LIFECYCLE_STATES.length - 1 && (
              <div style={{
                width: 24, height: 2,
                background: i < active ? C.green + "66" : "#333",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Active state detail */}
      <div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: C.accent,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}>
          Estado {active + 1} de {LIFECYCLE_STATES.length}
        </div>
        <div style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 28,
          color: "#fff",
          marginBottom: 10,
        }}>
          {state.label}
        </div>
        <div style={{
          fontSize: 15,
          color: "#999",
          lineHeight: 1.7,
          maxWidth: 560,
        }}>
          {state.desc}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button
          onClick={() => setActive(Math.max(0, active - 1))}
          disabled={active === 0}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #444",
            background: "transparent",
            color: active === 0 ? "#444" : "#999",
            cursor: active === 0 ? "default" : "pointer",
          }}
        >
          ← Anterior
        </button>
        <button
          onClick={() => setActive(Math.min(LIFECYCLE_STATES.length - 1, active + 1))}
          disabled={active === LIFECYCLE_STATES.length - 1}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: active === LIFECYCLE_STATES.length - 1 ? "#333" : C.accent,
            color: "#fff",
            cursor: active === LIFECYCLE_STATES.length - 1 ? "default" : "pointer",
          }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export default function Servicialo() {
  const [expandedOrigin, setExpandedOrigin] = useState("asset");
  const [activeNav, setActiveNav] = useState(null);

  const NAV_ITEMS = [
    { id: "que-es", label: "Qué es un servicio" },
    { id: "origen", label: "Cómo nace" },
    { id: "anatomia", label: "Anatomía" },
    { id: "ciclo", label: "Ciclo de vida" },
    { id: "principios", label: "Principios" },
    { id: "estandar", label: "El estándar" },
  ];

  const scrollTo = (id) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: C.bg + "EE",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", height: 52, gap: 32 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 14,
            fontWeight: 600,
            color: C.text,
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}>
            servicialo<span style={{ color: C.accent }}>.com</span>
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", flex: 1 }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: activeNav === item.id ? C.accent : C.textMuted,
                  background: "none",
                  border: "none",
                  padding: "8px 10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  borderBottom: `2px solid ${activeNav === item.id ? C.accent : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px 96px" }}>

        {/* Hero */}
        <Section>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: C.accent,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
          }}>
            El estándar abierto para servicios
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 52,
            fontWeight: 400,
            color: C.text,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}>
            Cualquier persona puede<br />
            crear un servicio.<br />
            <span style={{ color: C.accent }}>Cualquier agente puede<br />coordinarlo.</span>
          </h1>
          <p style={{ fontSize: 18, color: C.textMuted, lineHeight: 1.7, maxWidth: 540 }}>
            Servicialo define el lenguaje universal para crear, entregar y verificar servicios — para humanos y para agentes AI.
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 32, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: C.textDim }}>
            <span>◆ Estándar abierto</span>
            <span>◆ Machine-readable</span>
            <span>◆ Human-first</span>
          </div>
        </Section>

        {/* Qué es un servicio */}
        <Section id="que-es">
          <SectionTitle
            tag="01 — Definición"
            title="¿Qué es un servicio?"
            subtitle="Antes de crear uno, hay que entender qué es realmente."
          />
          <div style={{
            background: C.surface,
            borderRadius: 16,
            padding: "32px 36px",
            border: `1px solid ${C.border}`,
            marginBottom: 24,
          }}>
            <div style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 24,
              color: C.text,
              lineHeight: 1.5,
              marginBottom: 20,
            }}>
              Un servicio es una promesa de transformación entregada en un momento y lugar específico.
            </div>
            <div style={{ fontSize: 15, color: C.textBody, lineHeight: 1.8 }}>
              A diferencia de un producto, un servicio no se puede almacenar, revender ni devolver. Se consume en el momento en que se entrega. Eso lo hace fundamentalmente diferente — y es por eso que necesita su propio estándar.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { title: "Producto", traits: ["Se almacena", "Se revende", "Se devuelve", "Se envía", "Existe sin el creador"], emoji: "📦" },
              { title: "Servicio", traits: ["Se consume al entregarse", "Es irrepetible", "Requiere presencia", "Se verifica, no se rastrea", "Existe solo en el momento"], emoji: "⚡" },
              { title: "Combinado", traits: ["Producto + servicio", "Instalación", "Reparación con repuestos", "Consulta + medicamento", "El futuro del comercio"], emoji: "🔗" },
            ].map((col, i) => (
              <div key={i} style={{
                background: i === 1 ? C.accentSoft : C.surface,
                borderRadius: 12,
                padding: "20px",
                border: `1px solid ${i === 1 ? C.accent + "33" : C.border}`,
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{col.emoji}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>{col.title}</div>
                {col.traits.map((t, j) => (
                  <div key={j} style={{ fontSize: 13, color: C.textBody, lineHeight: 2 }}>
                    <span style={{ color: i === 1 ? C.accent : C.textDim, marginRight: 8 }}>—</span>{t}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* Cómo nace un servicio */}
        <Section id="origen">
          <SectionTitle
            tag="02 — Origen"
            title="Todo servicio nace de tres fuentes"
            subtitle="No necesitas una idea revolucionaria. Necesitas reconocer qué ya tienes."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SERVICE_ORIGINS.map((origin) => (
              <OriginCard
                key={origin.id}
                origin={origin}
                isExpanded={expandedOrigin === origin.id}
                onClick={() => setExpandedOrigin(expandedOrigin === origin.id ? null : origin.id)}
              />
            ))}
          </div>

          <div style={{
            marginTop: 24,
            background: C.surfaceAlt,
            borderRadius: 12,
            padding: "20px 24px",
            borderLeft: `3px solid ${C.accent}`,
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Insight
            </div>
            <div style={{ fontSize: 15, color: C.textBody, lineHeight: 1.7 }}>
              Los servicios más valiosos combinan dos o tres fuentes. Un kinesiólogo usa su <strong>ventaja</strong> (certificación + experiencia) aplicada en su <strong>tiempo</strong>, a veces con un <strong>activo</strong> (equipamiento especializado). Mientras más fuentes combines, más difícil de replicar y más valioso el servicio.
            </div>
          </div>
        </Section>

        {/* Anatomía de un servicio */}
        <Section id="anatomia">
          <SectionTitle
            tag="03 — Anatomía"
            title="Las 9 dimensiones de un servicio"
            subtitle="Para que un agente AI pueda coordinar un servicio, necesita entender estas 9 dimensiones."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ANATOMY.map((item, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 1fr",
                gap: 16,
                padding: "16px 20px",
                background: i % 2 === 0 ? C.surface : "transparent",
                borderRadius: 10,
                border: i % 2 === 0 ? `1px solid ${C.borderLight}` : "1px solid transparent",
                alignItems: "start",
              }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.accent,
                }}>
                  {item.field}
                </div>
                <div style={{ fontSize: 14, color: C.textBody, lineHeight: 1.6 }}>{item.desc}</div>
                <div style={{
                  fontSize: 12,
                  color: C.textMuted,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                }}>
                  {item.example}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Ciclo de vida */}
        <Section id="ciclo">
          <SectionTitle
            tag="04 — Ciclo de vida"
            title="8 estados universales"
            subtitle="Todo servicio — desde una consulta médica hasta una reparación del hogar — pasa por el mismo ciclo."
          />
          <LifecycleInteractive />

          <div style={{
            marginTop: 20,
            background: C.surfaceAlt,
            borderRadius: 12,
            padding: "20px 24px",
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              ¿Por qué 8 estados?
            </div>
            <div style={{ fontSize: 14, color: C.textBody, lineHeight: 1.8 }}>
              Menos estados pierden información crítica — por ejemplo, sin separar "Completado" de "Documentado", no sabes si el registro fue generado.
              Más estados agregan fricción innecesaria. 8 es el mínimo viable para que un agente AI pueda verificar con certeza que un servicio fue solicitado, entregado, documentado, cobrado y verificado.
            </div>
          </div>
        </Section>

        {/* Principios */}
        <Section id="principios">
          <SectionTitle
            tag="05 — Principios"
            title="Las reglas del estándar"
            subtitle="Servicialo se construye sobre 6 principios que aplican a cualquier servicio en cualquier industria."
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {PRINCIPLES.map((p, i) => (
              <div key={i} style={{
                background: C.surface,
                borderRadius: 14,
                padding: "22px 24px",
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: C.accent,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}>
                  Principio {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 18,
                  color: C.text,
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* El estándar */}
        <Section id="estandar">
          <SectionTitle
            tag="06 — El estándar"
            title="Service Delivery Protocol"
            subtitle="Servicialo es un estándar abierto. Cualquiera puede implementarlo."
          />

          <div style={{
            background: C.dark,
            borderRadius: 20,
            padding: "32px 36px",
            color: "#fff",
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
              Schema del servicio (v0.6)
            </div>
            <pre style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              lineHeight: 2,
              color: "#ccc",
              margin: 0,
              overflow: "auto",
            }}>
{`orden_de_servicio:
  id: string
  alcance: string             # Qué se acuerda entregar
  precio: number              # Precio total acordado
  esquema_pagos: string       # prepago | por_sesión | mensual
  currency: string            # ISO 4217

  servicios[]:                # Cada servicio atómico — 8 dimensiones
    service:
      id: string
      orden_de_servicio_id: string
      type: string            # Categoría del servicio
      vertical: string        # salud | legal | hogar | ...

      provider:
        id: string
        credentials: string[]
        trust_score: number   # 0-100

      client:
        id: string
        payer_id: string      # Puede diferir del client

      scheduling:
        requested_at: datetime
        scheduled_for: datetime
        duration_expected: minutes

      lifecycle:
        current_state: enum[8]  # Los 8 estados universales
        transitions: transition[]
        exceptions: exception[]

      delivery_proof:
        checkin: datetime
        checkout: datetime
        duration_actual: minutes
        evidence: evidence[]  # GPS, firma, fotos, docs

      billing:
        orden_de_servicio_id: string
        amount: money
        payer: reference
        status: pending | collected | paid | disputed

# Ledger computado desde servicios verificados — nunca editable`}
            </pre>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { title: "Implementadores", desc: "Construye productos sobre el estándar. Coordinalo es la primera implementación.", icon: "🔨", label: "Build" },
              { title: "Providers", desc: "Ofrece tus servicios en un formato que agentes AI entienden y pueden coordinar.", icon: "🎯", label: "Offer" },
              { title: "Agentes AI", desc: "Descubre, agenda y verifica servicios con un protocolo estandarizado.", icon: "🤖", label: "Connect" },
            ].map((card, i) => (
              <div key={i} style={{
                background: C.surface,
                borderRadius: 14,
                padding: "22px 24px",
                border: `1px solid ${C.border}`,
                textAlign: "center",
              }}>
                <span style={{ fontSize: 28 }}>{card.icon}</span>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: C.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: 8,
                  marginBottom: 6,
                }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18, color: C.text, marginBottom: 8 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          paddingTop: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: C.text }}>
              servicialo<span style={{ color: C.accent }}>.com</span>
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
              El estándar abierto para servicios — v0.6
            </div>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.textDim }}>
            Ecosistema: <span style={{ color: C.textMuted }}>Servicialo</span> → <span style={{ color: C.accent }}>Coordinalo</span> → <span style={{ color: C.purple }}>Orquestalo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
