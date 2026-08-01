import { SectionTitle } from "./SectionTitle";
import { RelationDiagram } from "./RelationDiagram";

export function ModeloSection() {
  return (
    <section id="modelo" className="mb-16">
      <SectionTitle
        tag="04 — El modelo"
        title="Lo acordado, lo entregado, la evidencia y la liquidación"
        subtitle="El protocolo separa explícitamente estos elementos. Cada uno conserva su propio ciclo de vida — el protocolo no impone un orden total entre ellos."
      />

      <div className="bg-surface rounded-[20px] border border-border p-4 md:p-8">
        <RelationDiagram />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-surface rounded-[14px] py-4 px-5 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-1.5">
            Prepago
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            El pago puede ocurrir antes de la entrega — la liquidación no
            espera al ciclo de entrega.
          </div>
        </div>
        <div className="bg-surface rounded-[14px] py-4 px-5 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-1.5">
            Facturación mensual
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Varias entregas bajo una Orden pueden liquidarse juntas, después —
            la entrega no espera a la liquidación.
          </div>
        </div>
        <div className="bg-surface rounded-[14px] py-4 px-5 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-1.5">
            Reembolso
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Una devolución no des-hace la entrega: el expediente conserva qué
            ocurrió y qué se revirtió.
          </div>
        </div>
      </div>
    </section>
  );
}
