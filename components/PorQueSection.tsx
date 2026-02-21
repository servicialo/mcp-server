import { SectionTitle } from "./SectionTitle";

export function PorQueSection() {
  return (
    <section id="por-que" className="mb-16">
      <SectionTitle
        tag="10 — Por qué Servicialo"
        title="Un idioma común para agentes"
      />

      {/* Why the protocol */}
      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-3">
        <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
          El problema
        </div>
        <div className="text-[13px] text-text-muted leading-[1.7] mb-3">
          Sin un protocolo estándar, cada plataforma de servicios habla su propio idioma.
          Un agente AI que quiere operar un negocio de servicios necesita una integración
          custom para cada uno.
        </div>
        <div className="text-[13px] text-text-body leading-[1.7]">
          <span className="font-semibold text-text">Servicialo es el idioma común.</span>{" "}
          Si una plataforma lo implementa, cualquier agente puede operar ese negocio
          sin integración adicional.
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
            Sin credenciales. 4 herramientas públicas.
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
            Agendar, verificar entrega, cobrar, cerrar el ciclo completo.
            Con credenciales. 20 herramientas en 6 fases.
          </div>
        </div>
      </div>

      <div className="mt-3 bg-surface rounded-[14px] py-4 px-4 md:px-6 border border-border">
        <div className="text-[13px] text-text-muted leading-[1.7]">
          <span className="font-semibold text-text">La diferencia entre un agente que informa y un agente que opera.</span>
        </div>
      </div>
    </section>
  );
}
