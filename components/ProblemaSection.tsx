import { SectionTitle } from "./SectionTitle";

export function ProblemaSection() {
  return (
    <section id="problema" className="mb-16">
      <SectionTitle
        tag="01 — El problema"
        title="Cada sistema representa los servicios a su manera"
        subtitle="Un servicio real vive fragmentado entre la agenda, los mensajes, el cobro, los formularios y los sistemas internos de cada parte."
      />

      <div className="flex flex-col gap-3 mb-6">
        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
            El problema no es agendar. Es que cada sistema representa de forma
            distinta <strong>qué se acordó</strong>, <strong>quién debía
            participar</strong>, <strong>qué ocurrió</strong>,{" "}
            <strong>qué evidencia existe</strong> y{" "}
            <strong>cómo se compensa</strong>.
          </div>
        </div>
        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
            Sin una semántica compartida, cada integración — entre plataformas
            o con agentes — vuelve a definir esas respuestas desde cero, y las
            definiciones no coinciden entre sistemas.
          </div>
        </div>
      </div>

      <blockquote className="border-l-[3px] border-l-accent pl-4 md:pl-6 py-1">
        <p className="font-serif text-lg md:text-xl text-text leading-[1.5]">
          MCP y A2A definen cómo se conectan los agentes.{" "}
          <span className="text-accent">
            Servicialo define qué significa un servicio: qué se acordó, qué se
            entregó, qué lo respalda y cómo se liquida.
          </span>
        </p>
      </blockquote>
    </section>
  );
}
