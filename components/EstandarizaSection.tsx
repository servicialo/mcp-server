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

// La cadena que explica por qué la portabilidad importa más allá de una
// transacción suelta. Definiciones canónicas — no describen capacidades
// disponibles hoy (ver la nota al pie de la sección).
const CHAIN = [
  {
    term: "Prueba",
    wire: "Proof",
    def: "Evidencia verificable de una obligación o gestión particular: qué se acordó, qué entrega ocurrió y qué la acredita bajo la política vigente entre las partes.",
  },
  {
    term: "Historial verificable",
    wire: "Verified history",
    def: "La acumulación longitudinal de esas pruebas: qué ocurrió, cuántas veces, en qué contexto, con qué excepciones y con qué disputas.",
  },
  {
    term: "Reputación",
    wire: "Reputation",
    def: "El contexto que ese historial aporta para una decisión concreta. No es un atributo del profesional ni un número que el protocolo emita: es una lectura del historial, hecha por quien decide y bajo su política.",
  },
  {
    term: "Decisión",
    wire: "Decision",
    def: "La acción de un tercero que cambia porque confía en ese contexto. Ahí — y no antes — el historial portable tiene valor económico.",
  },
];

export function EstandarizaSection() {
  return (
    <section id="que-estandariza" className="mb-16 md:mb-24 scroll-mt-16">
      <SectionTitle
        tag="04 — El modelo"
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

      {/* De la prueba a la reputación — por qué la portabilidad no termina en
          probar una transacción. Los cuatro tramos son definiciones, no
          capacidades: el protocolo modela hoy los dos primeros, y de forma
          parcial. La nota de cierre lo dice explícitamente. */}
      <div className="border-t border-border pt-8 md:pt-9 mb-7">
        <h3 className="font-serif text-[22px] md:text-[26px] font-medium text-text leading-[1.2] mb-5">
          De la prueba a la reputación
        </h3>

        <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-7">
          El expediente de una entrega no es el final del recorrido. La razón
          por la que la portabilidad importa no se agota en probar una
          transacción: se agota recién cuando el historial que esa transacción
          integra puede viajar con quien lo generó. Cuatro tramos, cada uno con
          un significado distinto.
        </p>

        <dl className="border-t border-border max-w-[700px] mb-7">
          {CHAIN.map((link) => (
            <div
              key={link.term}
              className="border-b border-border py-4 md:py-5 md:flex md:gap-8"
            >
              <dt className="md:w-[220px] md:shrink-0 mb-2 md:mb-0">
                <div className="font-mono text-[12px] font-semibold text-text uppercase tracking-[0.06em]">
                  {link.term}
                </div>
                <div className="font-mono text-[10px] text-accent mt-0.5">
                  {link.wire}
                </div>
              </dt>
              <dd className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.7]">
                {link.def}
              </dd>
            </div>
          ))}
        </dl>

        <blockquote className="border-b border-border pb-6 md:pb-7 mb-6">
          <p className="font-serif text-[20px] md:text-[24px] text-text leading-[1.45]">
            Servicialo no posee la reputación.{" "}
            <em className="text-accent">
              Hace portables y verificables los hechos que la sustentan.
            </em>
          </p>
        </blockquote>

        <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-5">
          El protocolo no define un score universal de reputación, y no es un
          olvido: un score es una interpretación, y cada tercero interpreta
          bajo su propia política. Quien financia y quien contrata pueden leer
          el mismo historial y llegar a decisiones distintas sin que ninguno se
          equivoque. Lo que el protocolo puede aportar es que los hechos sean
          los mismos y viajen; la lectura queda de cada lado.
        </p>

        <p className="max-w-[620px] text-[12px] text-text-muted leading-[1.7]">
          Los cuatro tramos son definiciones, no capacidades disponibles. El
          protocolo modela hoy los dos primeros, y parcialmente: la{" "}
          <a
            href="/extensions#proof-of-service"
            className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
          >
            Prueba de Servicio
          </a>{" "}
          es una extensión en borrador y la especificación normativa de
          portabilidad del historial está en desarrollo. Qué decisiones
          habilitaría un historial portable se trata como consecuencia
          condicional en{" "}
          <a
            href="/vision#red-de-confianza"
            className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
          >
            visión
          </a>
          , no como capacidad de hoy.
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
