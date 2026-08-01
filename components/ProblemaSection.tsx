import { SectionTitle } from "./SectionTitle";
import { TOOL_COUNTS } from "@/lib/manifest";

export function ProblemaSection() {
  return (
    <section id="problema" className="mb-16">
      {/* Anchor de compatibilidad con la IA anterior */}
      <span id="por-que" className="block scroll-mt-20" aria-hidden="true" />
      <SectionTitle
        tag="02 — El problema"
        title="Un idioma común para coordinar servicios"
        subtitle="Sin un protocolo compartido, cada plataforma de servicios habla su propio idioma — y cada integración redefine desde cero qué significa agendar, entregar, probar y cobrar."
      />

      {/* One-liner dev */}
      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1 mb-6">
        <p className="font-serif text-lg md:text-xl text-text leading-[1.5]">
          MCP y A2A definen cómo se conectan los agentes.{" "}
          <span className="text-accent">
            Servicialo define qué significa coordinar un servicio.
          </span>
        </p>
      </blockquote>

      {/* El problema */}
      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-3">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          El problema
        </div>
        <div className="text-[13px] text-text-muted leading-[1.7] mb-3">
          Sin un protocolo estándar, cada plataforma de servicios habla su
          propio idioma. Un agente IA que quiere operar un negocio de servicios
          necesita una integración personalizada para cada uno.
        </div>
        <div className="text-[13px] text-text-body leading-[1.7]">
          <span className="font-semibold text-text">
            Servicialo es el idioma común.
          </span>{" "}
          Si una plataforma lo implementa, cualquier agente puede operar ese
          negocio sin redefinir la semántica del servicio para cada plataforma.
        </div>
      </div>

      {/* Posicionamiento */}
      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-3">
        <div className="text-[13px] text-text-body leading-[1.7]">
          <span className="font-semibold text-text">
            Servicialo no estandariza una única operación rígida.
          </span>{" "}
          Estandariza la relación entre compromiso, entrega, evidencia y
          liquidación.
        </div>
      </div>

      {/* Discovery vs Authenticated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            Modo descubrimiento
          </div>
          <div className="font-mono text-[13px] font-semibold text-text mb-1.5">
            El agente puede ver
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Buscar organizaciones, consultar disponibilidad, listar servicios.
            Sin credenciales — {TOOL_COUNTS.public} herramientas públicas en la
            implementación de referencia.
          </div>
        </div>

        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            Modo autenticado
          </div>
          <div className="font-mono text-[13px] font-semibold text-text mb-1.5">
            El agente puede actuar
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Agendar, verificar entrega, cobrar, cerrar el ciclo completo. Con
            credenciales — {TOOL_COUNTS.total} herramientas en total.
          </div>
        </div>
      </div>

      <div className="mt-3 bg-surface rounded-[14px] py-4 px-4 md:px-6 border border-border">
        <div className="text-[13px] text-text-muted leading-[1.7]">
          <span className="font-semibold text-text">
            La diferencia entre un agente que informa y un agente que opera.
          </span>
        </div>
      </div>
    </section>
  );
}
