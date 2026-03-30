import { SectionTitle } from "./SectionTitle";

export function InclusionSection() {
  return (
    <section id="inclusion" className="mb-16">
      <SectionTitle
        tag="Inclusion financiera"
        title="Datos de servicio como pasaporte financiero"
        subtitle="Construido para los proveedores que el sistema financiero ignora — el kinesiólogo, el entrenador personal, la psicóloga que factura con boleta."
      />

      <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border mb-3">
        <div className="text-[13px] text-text-body leading-[1.7] mb-4">
          En Latinoamérica, millones de profesionales entregan servicios de forma informal: confirman por WhatsApp,
          registran pagos en un cuaderno y facturan con boleta. Son invisibles para la banca, invisibles para la tecnología,
          invisibles para la economía que sostienen.
        </div>
        <div className="text-[13px] text-text-body leading-[1.7]">
          Los datos estructurados de servicios — clientes recurrentes, tasas de asistencia, historial de pagos — son
          mejor señal de solvencia que una liquidación de sueldo. Servicialo convierte esa operación invisible en
          datos verificables: la rampa de acceso a la inclusión financiera.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            El problema
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Sin liquidación de sueldo no hay crédito. Sin crédito no hay tarjeta.
            Sin tarjeta no hay cobro automatizado. El ciclo se repite.
          </div>
        </div>

        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            La señal
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Contexto de servicio: sesiones recurrentes, tasa de cumplimiento, historial de cobros.
            Mejor señal crediticia que un recibo de nómina.
          </div>
        </div>

        <div className="bg-surface rounded-[14px] py-5 px-4 md:px-6 border border-border">
          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
            El camino
          </div>
          <div className="text-[13px] text-text-muted leading-[1.7]">
            Contexto de servicio &rarr; scoring crediticio &rarr; tarjeta Digitalo &rarr; facilitación de pagos.
            Inclusión por diseño, no por caridad.
          </div>
        </div>
      </div>
    </section>
  );
}
