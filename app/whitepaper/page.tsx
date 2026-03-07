import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Whitepaper — Servicialo",
  description:
    "Protocolo abierto para la definición, descubrimiento y coordinación de servicios profesionales.",
  openGraph: {
    title: "Whitepaper — Servicialo",
    description:
      "Protocolo abierto para la definición, descubrimiento y coordinación de servicios profesionales.",
  },
};

const secciones = [
  {
    num: "01",
    titulo: "El problema",
    desc: "Por qué los servicios profesionales siguen siendo invisibles para la tecnología.",
  },
  {
    num: "02",
    titulo: "Anatomía del servicio",
    desc: "Las 8 dimensiones que definen cualquier servicio profesional de forma estructurada.",
  },
  {
    num: "03",
    titulo: "Servicio y Orden de Servicio",
    desc: "Las dos entidades centrales del protocolo y su relación contractual.",
  },
  {
    num: "04",
    titulo: "Ciclo de vida",
    desc: "9 estados universales que modelan desde la solicitud hasta la verificación.",
  },
  {
    num: "05",
    titulo: "Excepciones y disputas",
    desc: "Flujos de cancelación, reprogramación, y el mecanismo de resolución 80/20.",
  },
  {
    num: "06",
    titulo: "Evidencia y cumplimiento",
    desc: "Evidencia por vertical, cumplimiento regulatorio y trazabilidad de agentes AI.",
  },
  {
    num: "07",
    titulo: "Servidor MCP",
    desc: "20 herramientas organizadas en 6 fases para operar el protocolo desde agentes AI.",
  },
  {
    num: "08",
    titulo: "Especificación técnica v0.6.0",
    desc: "JSON Schema, endpoints REST y estructura completa de implementación.",
  },
];

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
          Protocolo abierto para servicios profesionales
        </h1>
        <p className="text-[15px] md:text-lg text-text-muted leading-[1.7] max-w-[540px] mb-6">
          Definición, descubrimiento y coordinación —{" "}
          <span className="text-accent">un estándar para agentes y humanos.</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-text-dim mb-8">
          <span>◆ Franco Danioni</span>
          <span>◆ Marzo 2026</span>
          <span>◆ v1.0</span>
        </div>

        <a
          href="/docs/servicialo-whitepaper.pdf"
          download
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-mono text-[13px] font-semibold px-5 py-3 rounded-lg transition-colors"
        >
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
          Descargar PDF
        </a>
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
          Este whitepaper especifica el protocolo Servicialo v0.6.0 — definición
          de servicios, ciclo de vida, resolución de disputas, y la interfaz MCP
          para agentes AI.
        </p>
        <a
          href="/docs/servicialo-whitepaper.pdf"
          download
          className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
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
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Descargar PDF
        </a>
      </section>
    </div>
  );
}
