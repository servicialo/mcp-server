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
    <section id="que-estandariza" className="mb-16">
      <SectionTitle
        tag="02 — Qué estandariza"
        title="Cinco elementos, un lenguaje común"
        subtitle="El protocolo define objetos y eventos legibles por máquinas para cada etapa de un servicio — y la relación entre ellas."
      />

      <ol className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4 list-none">
        {STAGES.map((stage, i) => (
          <li
            key={stage.label}
            className="bg-surface rounded-[14px] py-4 px-4 border border-border"
          >
            <div className="font-mono text-[10px] text-text-dim mb-1.5">
              {i + 1} / {STAGES.length}
            </div>
            <div className="font-serif text-lg text-text leading-tight">
              {stage.label}
            </div>
            <div className="font-mono text-[10px] text-accent mt-0.5 mb-2">
              {stage.wire}
            </div>
            <div className="text-[12px] text-text-muted leading-[1.6]">
              {stage.desc}
            </div>
          </li>
        ))}
      </ol>

      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-3">
        <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
          Cada elemento conserva su propio ciclo de vida: el protocolo no
          impone un orden total entre entrega, evidencia y liquidación. Un
          prepago, una facturación mensual o un servicio sin costo no rompen
          el modelo.
        </div>
      </div>

      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em]">
            Prueba de Servicio
          </div>
          <MaturityBadge maturity="draft" />
        </div>
        <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
          Una <strong>Prueba de Servicio</strong> es el expediente que vincula
          estos elementos para una entrega concreta: afirmaciones, eventos,
          evidencia, atestaciones y niveles de certeza. No declara la verdad
          del mundo ni reemplaza el juicio sobre la calidad. Hoy el expediente
          es derivable de los objetos actuales del protocolo; su formalización
          como objeto propio es una{" "}
          <a
            href="/extensions#proof-of-service"
            className="text-accent hover:underline"
          >
            extensión en borrador
          </a>
          .
        </div>
      </div>

      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-4">
        <div className="text-[13px] md:text-sm text-text-body leading-[1.7]">
          Servicialo no impone una plataforma, un medio de pago, un modelo de
          negocio, un agente ni una interfaz. Define la semántica; cada
          implementación decide el resto.
        </div>
      </div>

      <a
        href="/spec#objects"
        className="font-mono text-[11px] text-accent hover:text-text transition-colors"
      >
        Objetos, esquemas y máquinas de estado en la especificación →
      </a>
    </section>
  );
}
