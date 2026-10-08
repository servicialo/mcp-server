import { SectionTitle } from "./SectionTitle";
import { MaturityBadge } from "./MaturityBadge";
import { CERTAINTY_LEVELS } from "@/lib/data";

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

      {/* Atestación con incentivos opuestos — qué hace confiable a una
          atestación: no la firma, sino quién atesta y qué tiene en juego. El
          principio se enuncia; lo que corre hoy se dice en la línea de estado
          (la relación de interés del atestante no es dato todavía — issue #53).
          El gradiente L1–L4 se renderiza desde protocol/manifest.yaml vía
          lib/data.ts (CERTAINTY_LEVELS), con su estado real: borrador, dentro
          de la extensión Proof of Service. No existe objeto wire. */}
      <div className="border-t border-border pt-8 md:pt-9 mb-7">
        <h3 className="font-serif text-[22px] md:text-[26px] font-medium text-text leading-[1.2] mb-5">
          Atestación con incentivos opuestos
        </h3>

        <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-5">
          Una firma prueba quién declaró algo y que el registro no se alteró
          después. No prueba que lo declarado sea verdad: dos partes con el
          mismo interés pueden firmar juntas una falsedad perfectamente
          verificable.
        </p>

        <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-5">
          Por eso la certeza de una evidencia depende de quién la atesta y de
          qué tiene en juego. Vale más cuando la confirman partes con intereses
          opuestos — el cliente confirma la entrega que el prestador quiere
          cobrar — y cuando quien atesta responde por lo que firma.
        </p>

        <p className="max-w-[620px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-5">
          El protocolo no resuelve la colusión por sí solo. Lo que puede hacer
          es dejarla visible: que cada atestación diga quién la hizo y qué
          relación tenía con la obligación, para que cada consumidor de la
          prueba aplique su propia política sobre cuánta corroboración exige y
          de qué tipo.
        </p>

        {/* Qué corre hoy, pegado al principio que lo motiva. */}
        <div className="max-w-[620px] flex items-start gap-2.5 mb-7">
          <MaturityBadge maturity="design" />
          <p className="text-[12px] text-text-muted leading-[1.6]">
            Hoy cada atestación registra quién la hizo y en qué rol operativo
            (prestador, cliente, sistema o agente). Su relación de interés con
            la obligación todavía no se expresa como dato legible por quien
            consume la prueba. La propuesta está planteada en el{" "}
            <a
              href="https://github.com/servicialo/mcp-server/issues/53"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
            >
              issue #53
            </a>
            .
          </p>
        </div>

        <div className="border border-border border-l-2 border-l-text bg-surface-alt py-5 px-5 md:px-6">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="font-mono text-[10px] font-semibold text-text uppercase tracking-[0.1em]">
              Gradiente de certeza
            </div>
            <MaturityBadge maturity="draft" />
          </div>
          <p className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.75] mb-4">
            El gradiente de certeza es la forma en que el protocolo expresa
            ese principio: ordena la evidencia disponible según cuántas fuentes
            la corroboran y qué tan independientes son de quien afirma.
          </p>
          <ol className="list-none border-t border-border">
            {CERTAINTY_LEVELS.map((l) => (
              <li
                key={l.level}
                className="border-b border-border py-3 md:flex md:gap-6"
              >
                <div className="md:w-[220px] md:shrink-0 mb-1 md:mb-0">
                  <span className="font-mono text-[12px] font-semibold text-accent tabular-nums">
                    {l.level}
                  </span>
                  <span className="font-mono text-[12px] text-text ml-2.5">
                    {l.name}
                  </span>
                </div>
                <div className="text-[13px] text-text-muted leading-[1.6]">
                  {l.desc}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[12px] text-text-muted leading-[1.7]">
            Los niveles se acumulan en evidencia, no en verdad: L4 no
            significa “más cierto”, significa que además existe conciliación
            financiera. Una entrega gratuita puede alcanzar certeza suficiente
            sin llegar a L4, y la acreditación es una dimensión aparte,
            definida por política. El gradiente está en diseño dentro de la
            extensión{" "}
            <a
              href="/extensions#proof-of-service"
              className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
            >
              Proof of Service
            </a>{" "}
            (borrador); no existe objeto wire todavía.
          </p>
        </div>
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
          La reputación es contexto, no un score universal. Cada tercero
          interpreta el historial verificable bajo su propia política.
        </p>

        <p className="max-w-[620px] text-[12px] text-text-muted leading-[1.7]">
          Los cuatro tramos son definiciones, no capacidades disponibles.
          Servicialo modela las primitivas necesarias para producir evidencia
          de servicio verificable; el historial portable y la reputación siguen
          siendo hipótesis por construir y validar entre nodos independientes.
          La{" "}
          <a
            href="/extensions#proof-of-service"
            className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
          >
            Prueba de Servicio
          </a>{" "}
          es una extensión en borrador y la portabilidad del historial no tiene
          todavía especificación normativa. Qué decisiones habilitaría se trata
          en{" "}
          <a
            href="/vision#red-de-confianza"
            className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
          >
            visión
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
