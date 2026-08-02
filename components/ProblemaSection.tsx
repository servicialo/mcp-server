import { SectionTitle } from "./SectionTitle";

export function ProblemaSection() {
  return (
    <section id="problema" className="mb-16 md:mb-24">
      <SectionTitle
        tag="01 — El problema"
        title="Cada sistema representa los servicios a su manera"
        subtitle="Un servicio real vive fragmentado entre la agenda, los mensajes, el cobro, los formularios y los sistemas internos de cada parte."
      />

      <div className="space-y-5 mb-9 md:mb-10 max-w-[620px]">
        <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
          El problema no es agendar. Es que cada sistema representa de forma
          distinta <strong>qué se acordó</strong>, <strong>quién debía
          participar</strong>, <strong>qué ocurrió</strong>,{" "}
          <strong>qué evidencia existe</strong> y{" "}
          <strong>cómo se compensa</strong>.
        </p>
        <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
          Sin una semántica compartida, cada integración — entre plataformas
          o con agentes — vuelve a definir esas respuestas desde cero, y las
          definiciones no coinciden entre sistemas.
        </p>
      </div>

      <blockquote className="border-y border-border py-6 md:py-7">
        <p className="font-serif text-[20px] md:text-[24px] text-text leading-[1.45]">
          MCP y A2A definen cómo se conectan los agentes.{" "}
          <em className="text-accent">
            Servicialo define qué significa un servicio: qué se acordó, qué se
            entregó, qué lo respalda y cómo se liquida.
          </em>
        </p>
      </blockquote>
    </section>
  );
}
