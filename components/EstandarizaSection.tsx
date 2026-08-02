import { SectionTitle } from "./SectionTitle";
import { MaturityBadge } from "./MaturityBadge";

// Los cinco elementos que el protocolo representa y conecta. Los objetos
// canónicos, sus schemas y su estado viven en protocol/manifest.yaml y se
// documentan en /spec#objects.
const STAGES = [
  {
    label: "Oferta",
    wire: "Service Offer",
    desc: "Lo que una organización publica: servicios, condiciones y disponibilidad.",
  },
  {
    label: "Acuerdo",
    wire: "Service Order",
    desc: "Lo pactado entre las partes: alcance, precio, políticas y quién paga.",
  },
  {
    label: "Entrega",
    wire: "Service Delivery",
    desc: "Cada instancia ejecutada del servicio, con su propio estado.",
  },
  {
    label: "Evidencia",
    wire: "Evidence Events",
    desc: "Los registros que respaldan lo ocurrido: confirmaciones, firmas, marcas de tiempo.",
  },
  {
    label: "Liquidación",
    wire: "Settlement Events",
    desc: "Los movimientos financieros vinculados: factura, pago, devolución.",
  },
];

export function EstandarizaSection() {
  return (
    <section id="que-estandariza" className="mb-16 md:mb-24">
      <SectionTitle
        tag="02 — Qué estandariza"
        title="Cinco elementos, un lenguaje común"
        subtitle="El protocolo define objetos y eventos legibles por máquinas para cada etapa de un servicio — y la relación entre ellas."
      />

      <ol className="grid grid-cols-1 md:grid-cols-5 list-none border border-border bg-surface divide-y md:divide-y-0 md:divide-x divide-border mb-8 md:mb-10">
        {STAGES.map((stage, i) => (
          <li key={stage.label} className="p-4 md:px-4 md:py-5">
            <div className="font-mono text-[10px] text-text-dim tabular-nums mb-3">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="font-serif text-lg font-medium text-text leading-tight">
              {stage.label}
            </div>
            <div className="font-mono text-[10px] text-accent mt-1 mb-2">
              {stage.wire}
            </div>
            <p className="text-[12px] text-text-muted leading-[1.6]">
              {stage.desc}
            </p>
          </li>
        ))}
      </ol>

      <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-7">
        Cada elemento conserva su propio ciclo de vida: el protocolo no
        impone un orden total entre entrega, evidencia y liquidación. Un
        prepago, una facturación mensual o un servicio sin costo no rompen
        el modelo.
      </p>

      <div className="border border-border border-l-2 border-l-text bg-surface-alt py-5 px-5 md:px-6 mb-7">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="font-mono text-[10px] font-semibold text-text uppercase tracking-[0.1em]">
            Prueba de Servicio
          </div>
          <MaturityBadge maturity="draft" />
        </div>
        <p className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.75]">
          Una <strong>Prueba de Servicio</strong> es el expediente que vincula
          estos elementos para una entrega concreta: afirmaciones, eventos,
          evidencia, atestaciones y niveles de certeza. No declara la verdad
          del mundo ni reemplaza el juicio sobre la calidad. Hoy el expediente
          es derivable de los objetos actuales del protocolo; su formalización
          como objeto propio es una{" "}
          <a
            href="/extensions#proof-of-service"
            className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
          >
            extensión en borrador
          </a>
          .
        </p>
      </div>

      <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-7">
        Servicialo no impone una plataforma, un medio de pago, un modelo de
        negocio, un agente ni una interfaz. Define la semántica; cada
        implementación decide el resto.
      </p>

      <a
        href="/spec#objects"
        className="group font-mono text-[11px] text-accent hover:text-accent-dark transition-colors"
      >
        Objetos, esquemas y máquinas de estado en la especificación{" "}
        <span
          aria-hidden
          className="inline-block transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </a>
    </section>
  );
}
