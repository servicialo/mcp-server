import { SectionTitle } from "./SectionTitle";

// Los tres contrafactuales: qué ocurre si la semántica de servicio no existe.
// Prosa breve — cada uno es una consecuencia observable, no una consigna.
const COUNTERFACTUALS = [
  {
    label: "La evidencia queda cautiva",
    body: (
      <>
        Lo que prueba que una entrega ocurrió — la confirmación, la hora real,
        la firma, el documento — existe, pero vive dentro del software que
        corrió esa hora. No hay una forma acordada de sacarlo, así que el
        registro del profesional deja de ser suyo: es un subproducto del
        sistema que eligió para agendar. Y no queda cautiva sólo la prueba de
        esa entrega: queda cautivo el historial. Diez años de entregas
        acreditadas no se acumulan en un registro que viaje con quien las
        prestó — se acumulan fragmentados entre los sistemas que se fueron
        usando, y cada cambio de plataforma empieza el conteo de nuevo.
      </>
    ),
  },
  {
    label: "Verificar es N×M",
    body: (
      <>
        Cualquier tercero que necesite verificar una entrega — un pagador, una
        aseguradora, un auditor, un prestamista, un agente — tiene que
        integrarse una vez por cada sistema del que provenga la evidencia. En la práctica ese
        problema no se resuelve: se recorta. Se integra con los más grandes y
        el resto queda fuera de la verificación, no por incumplir sino por no
        ser integrable.
      </>
    ),
  },
  {
    label: "La semántica se hereda",
    body: (
      <>
        Si la semántica de servicio no existe cuando los agentes empiecen a
        coordinar a volumen, se hereda de la que sí existe: la de los bienes.
        Ahí el no-show, el reagendamiento y el pagador distinto del beneficiario
        son casos borde de un modelo pensado para paquetes que se despachan y
        llegan — no rasgos ordinarios de lo que se está modelando.
      </>
    ),
  },
];

export function ProblemaSection() {
  return (
    <section id="problema" className="mb-16 md:mb-24 scroll-mt-16">
      <SectionTitle
        tag="01 — El problema"
        title="Qué pasa si esto no se define"
        subtitle="No es un problema de agendas. La evidencia de cumplimiento existe: lo que no existe es una forma acordada de decir qué se prometió, qué se entregó y qué lo prueba — y la ausencia tiene tres consecuencias concretas."
      />

      <ol className="list-none space-y-7 md:space-y-8 max-w-[640px]">
        {COUNTERFACTUALS.map((item, i) => (
          <li key={item.label}>
            <div className="font-mono text-[11px] mb-2">
              <span className="text-text-dim tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-semibold text-text ml-2.5 uppercase tracking-[0.08em]">
                {item.label}
              </span>
            </div>
            <p className="font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75]">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
