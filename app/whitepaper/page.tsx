import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Whitepaper — Servicialo",
  description:
    "Protocolo abierto para la definición, descubrimiento y coordinación de servicios profesionales con agentes IA.",
  openGraph: {
    title: "Whitepaper — Servicialo",
    description:
      "Protocolo abierto para la definición, descubrimiento y coordinación de servicios profesionales con agentes IA.",
  },
};

const secciones = [
  {
    num: "01",
    titulo: "El problema",
    desc: "Por qué los servicios profesionales siguen siendo invisibles para los agentes IA.",
  },
  {
    num: "02",
    titulo: "Descripción del protocolo",
    desc: "Historial de versiones y qué define Servicialo: descubrimiento, herramientas, acceso, delegación, A2A y finanzas.",
  },
  {
    num: "03",
    titulo: "7 Principios fundamentales",
    desc: "Interoperabilidad por defecto, autoridad humana, divulgación progresiva, auditabilidad, soberanía financiera, privacidad clínica e inteligencia colectiva.",
  },
  {
    num: "04",
    titulo: "Modelo de acceso en 3 niveles",
    desc: "Nivel 0 (10 herramientas públicas), Nivel 1 (autenticado) y Nivel 2 (ServiceMandate delegado).",
  },
  {
    num: "05",
    titulo: "Las 8 dimensiones del servicio",
    desc: "Qué, quién entrega, quién recibe, cuándo, dónde, ciclo de vida, evidencia y cobro.",
  },
  {
    num: "06",
    titulo: "9 estados universales del ciclo de vida",
    desc: "Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Facturado → Cobrado → Verificado.",
  },
  {
    num: "07",
    titulo: "6 flujos de excepción",
    desc: "Inasistencia, cancelación, disputa de calidad, reagendamiento, servicio parcial y conflicto de recurso.",
  },
  {
    num: "08",
    titulo: "Sistema de resolución DNS",
    desc: "Cadena de 4 fases, 6 herramientas de resolución y la extensión x-servicialo en el Agent Card.",
  },
  {
    num: "09",
    titulo: "Modelo de agencia delegada",
    desc: "ServiceMandate: autorización firmada, acotada y revocable para que los agentes actúen en nombre de humanos.",
  },
  {
    num: "10",
    titulo: "Interoperabilidad A2A v0.3",
    desc: "message/send, campo kind, extensión x-servicialo requerida y composición con Google ADK, Salesforce Agentforce.",
  },
  {
    num: "11",
    titulo: "Habilidades Génesis del agente",
    desc: "5 capacidades emergentes: descubrimiento autónomo, reserva E2E (verificada en prod), contexto clínico, derivación inter-org y conciliación financiera.",
  },
  {
    num: "12",
    titulo: "Inclusión financiera",
    desc: "Pago multi-modal, codigoPrestacion FONASA como campo de primera clase, y modelos de pago parcial.",
  },
  {
    num: "13",
    titulo: "Implementación de referencia: Coordinalo",
    desc: "Estado actual, arquitectura y Mamá Pro como despliegue de referencia en producción.",
  },
  {
    num: "14",
    titulo: "Ecosistema, registro y hoja de ruta",
    desc: "Requisitos para aparecer en el registro, npm @servicialo/mcp-server, y roadmap v1.0 → v2.0.",
  },
];

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export default function WhitepaperPage() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      {/* Volver */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-accent transition-colors mb-8"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver al inicio
      </Link>

      {/* Header */}
      <section className="mb-14 md:mb-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
          Whitepaper fundacional
        </div>
        <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
          Estándar abierto para servicios profesionales
        </h1>
        <p className="text-[15px] md:text-lg text-text-muted leading-[1.7] max-w-[540px] mb-6">
          Definición, descubrimiento y coordinación —{" "}
          <span className="text-accent">para agentes IA y humanos.</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-text-dim mb-8">
          <span>◆ Franco Danioni</span>
          <span>◆ Marzo 2026</span>
          <span>◆ v0.9</span>
          <span>◆ 35 MCP tools · 9 estados · 7 principios · 6 excepciones</span>
        </div>

        {/* Botones de descarga */}
        <div className="flex flex-wrap gap-3">
          {/* Primario: Español */}
          <a
            href="/docs/servicialo-whitepaper.pdf"
            download="servicialo-whitepaper-v0.9-es.pdf"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-mono text-[13px] font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            <DownloadIcon />
            Descargar PDF — Español
          </a>

          {/* Secundario: Inglés */}
          <a
            href="/docs/servicialo-whitepaper-en.pdf"
            download="servicialo-whitepaper-v0.9-en.pdf"
            className="inline-flex items-center gap-2 border border-border text-text-muted hover:border-accent hover:text-accent font-mono text-[13px] font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            <DownloadIcon />
            Download PDF — English
          </a>
        </div>
      </section>

      {/* Contenido */}
      <section>
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-6">
          Contenido
        </div>

        <div className="grid gap-4">
          {secciones.map((s) => (
            <div
              key={s.num}
              className="group border border-border rounded-lg p-4 md:p-5 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="font-mono text-[13px] font-semibold text-accent shrink-0 pt-0.5">
                  {s.num}
                </span>
                <div>
                  <h3 className="font-serif text-[18px] md:text-[20px] text-text leading-tight mb-1">
                    {s.titulo}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-14 md:mt-20 border-t border-border pt-8">
        <p className="text-sm text-text-muted leading-relaxed mb-5">
          Este whitepaper especifica el protocolo Servicialo v0.9 — ciclo de vida
          de servicios, modelo de acceso en 3 niveles, agencia delegada,
          interoperabilidad A2A v0.3, inclusión financiera e interfaz MCP de 35
          herramientas para agentes IA.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/docs/servicialo-whitepaper.pdf"
            download="servicialo-whitepaper-v0.9-es.pdf"
            className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Descargar en español
          </a>
          <a
            href="/docs/servicialo-whitepaper-en.pdf"
            download="servicialo-whitepaper-v0.9-en.pdf"
            className="inline-flex items-center gap-2 border border-border text-text-muted hover:border-accent hover:text-accent font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download in English
          </a>
        </div>
      </section>
    </div>
  );
}
