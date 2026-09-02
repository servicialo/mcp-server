import { SectionTitle } from "./SectionTitle";

// § 03 — Declaración de no-alcance. Cada línea dice qué NO es y con qué
// compone en su lugar. Espeja PROTOCOL.md §1.2 (Scope and Non-Goals).
//
// TODO(autor): la composición con credenciales verificables se enuncia como
// no-alcance, pero el binding concreto (qué formato de credencial, cómo entra
// en `origin: verified` / `verified_by` de ProviderAttribute) no está
// especificado. Decidir si se especifica o si se declara explícitamente
// fuera de alcance de forma permanente.
const NON_GOALS = [
  {
    not: "No es un marketplace",
    compose:
      "No intermedia la relación comercial ni captura la demanda. Compone con los marketplaces, directorios y agentes que ya lo hacen: el resolver responde slug → endpoint y el registry publica qué ofrece una organización; el precio, la selección y la relación con el cliente quedan en el nodo.",
  },
  {
    not: "No es un riel de pago",
    compose:
      "Modela estados de liquidación — factura, cargo, pago, devolución, conciliación — pero no mueve dinero. Compone con los rieles que ya existen: el evento de liquidación referencia el movimiento; el movimiento ocurre fuera del protocolo.",
  },
  {
    not: "No es un producto de agendamiento",
    compose:
      "Define semántica de disponibilidad, compromiso y reagendamiento; no reemplaza el calendario, la interfaz de reserva ni el motor de agenda. Compone con los productos de agenda que ya operan: la agenda sigue donde está, el acuerdo se vuelve legible fuera de ella.",
  },
  {
    not: "No es un sistema de identidad",
    compose:
      "No emite ni verifica identidad de personas ni de organizaciones. Compone con credenciales verificables y con los emisores que ya acreditan títulos, matrículas y habilitaciones: el protocolo transporta el atributo, su origen y quién lo verificó — no lo certifica.",
  },
  {
    not: "No es un transporte",
    compose:
      "No define cómo se conectan dos sistemas. Compone con MCP y A2A, y con HTTP como binding normativo: el protocolo dice qué significa el mensaje; el transporte, cómo llega.",
  },
];

// Reparto de capas. Servicialo no necesita poseer identidad, autorización ni
// el sobre criptográfico con que viaja la evidencia; si emerge un estándar
// común para cualquiera de esas capas, puede expresarse como un perfil de
// servicios sobre él.
//
// TODO(autor): ningún perfil de ese tipo está escrito. La afirmación es sobre
// la forma del protocolo — semántica separada del sobre que la transporta —,
// no sobre un trabajo de interoperabilidad existente. La nota al pie lo dice.
const LAYERS = [
  {
    layer: "Identidad",
    who: "Otro estándar",
    what: "puede establecer quién actuó.",
  },
  {
    layer: "Autorización",
    who: "Otro estándar",
    what: "puede establecer qué le estaba permitido hacer.",
  },
  {
    layer: "Transporte y sobre de evidencia",
    who: "Otro estándar",
    what: "puede transportar y firmar la evidencia.",
  },
  {
    layer: "Servicialo",
    who: "",
    what:
      "Define qué significaba la obligación de servicio, qué estado alcanzó, qué evidencia la respalda y cómo ese historial puede seguir siendo portable.",
    self: true,
  },
];

export function FueraDeAlcanceSection() {
  return (
    <section id="fuera-de-alcance" className="mb-16 md:mb-24 scroll-mt-16">
      <SectionTitle
        tag="03 — Fuera de alcance"
        title="Qué NO es"
        subtitle="Un protocolo se define tanto por lo que deja fuera como por lo que modela. Cinco cosas que Servicialo no es, y con qué compone en su lugar."
      />

      <dl className="border-t border-border max-w-[700px]">
        {NON_GOALS.map((item) => (
          <div
            key={item.not}
            className="border-b border-border py-5 md:py-6 md:flex md:gap-8"
          >
            <dt className="md:w-[220px] md:shrink-0 font-mono text-[12px] font-semibold text-text uppercase tracking-[0.06em] mb-2 md:mb-0">
              {item.not}
            </dt>
            <dd className="font-serif text-[15px] md:text-[16px] text-text-body leading-[1.7]">
              {item.compose}
            </dd>
          </div>
        ))}
      </dl>

      <blockquote className="border-b border-border py-6 md:py-7 mb-6">
        <p className="font-serif text-[20px] md:text-[24px] text-text leading-[1.45]">
          MCP y A2A definen cómo se conectan los agentes.{" "}
          <em className="text-accent">
            Servicialo define qué significa un servicio: qué se acordó, qué se
            entregó, qué lo respalda y cómo se liquida.
          </em>
        </p>
      </blockquote>

      {/* Composabilidad: qué capa ocupa Servicialo si otra especificación gana
          las capas de abajo. No compite con ellas — se monta encima. */}
      <div className="border-t border-border pt-8 md:pt-9 mb-8">
        <h3 className="font-serif text-[22px] md:text-[26px] font-medium text-text leading-[1.2] mb-5">
          Servicialo define semántica de servicio, no el stack de confianza
          completo
        </h3>

        <p className="max-w-[640px] font-serif text-[16px] md:text-[17px] text-text-body leading-[1.75] mb-7">
          De la lista anterior se sigue algo que conviene decir directamente:
          Servicialo no necesita controlar el transporte, la identidad, la
          autorización ni el mecanismo criptográfico con que viaja la
          evidencia. Si emerge un estándar común para cualquiera de esas capas,
          Servicialo puede expresarse como un perfil de servicios sobre él —
          sin cambiar lo que modela.
        </p>

        <dl className="border-t border-border max-w-[700px] mb-6">
          {LAYERS.map((row) => (
            <div
              key={row.layer}
              className={`border-b border-border py-4 md:py-5 md:flex md:gap-8 ${
                row.self ? "border-l-2 border-l-text bg-surface-alt -mx-4 px-4" : ""
              }`}
            >
              <dt
                className={`md:w-[220px] md:shrink-0 font-mono text-[12px] uppercase tracking-[0.06em] mb-2 md:mb-0 ${
                  row.self ? "font-semibold text-text" : "text-text-muted"
                }`}
              >
                {row.layer}
              </dt>
              <dd
                className={`font-serif text-[15px] md:text-[16px] leading-[1.7] ${
                  row.self ? "text-text" : "text-text-body"
                }`}
              >
                {row.who && (
                  <>
                    <span className="text-text-muted">{row.who}</span>{" "}
                  </>
                )}
                {row.what}
              </dd>
            </div>
          ))}
        </dl>

        <p className="max-w-[640px] font-serif text-[15px] md:text-[16px] text-text-body leading-[1.75] mb-5">
          La autorización responde qué le estaba permitido hacer a alguien.
          Servicialo responde qué ocurrió efectivamente. Son preguntas
          distintas, y una capa adyacente que resuelva la primera no compite
          con la segunda: la habilita.
        </p>

        <p className="max-w-[640px] text-[12px] text-text-muted leading-[1.7]">
          Ningún perfil de ese tipo está escrito hoy. La afirmación es sobre la
          forma del protocolo — la semántica está separada del sobre que la
          transporta —, no sobre un trabajo de interoperabilidad existente.
        </p>
      </div>

      <p className="max-w-[640px] text-[13px] text-text-muted leading-[1.75]">
        La declaración de no-alcance normativa vive en{" "}
        <a
          href="https://github.com/servicialo/mcp-server/blob/main/PROTOCOL.md#12-scope-and-non-goals"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          PROTOCOL.md §1.2
        </a>
. Lo que sí obliga el protocolo está en la{" "}
        <a
          href="/spec"
          className="text-accent underline decoration-border hover:decoration-accent underline-offset-4 transition-colors"
        >
          especificación
        </a>
        .
      </p>
    </section>
  );
}
