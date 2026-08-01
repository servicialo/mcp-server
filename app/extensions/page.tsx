import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MaturityBadge, type MaturityVariant } from "@/components/MaturityBadge";
import { Footer } from "@/components/Footer";
import { EvidenciaVerticalSection } from "@/components/EvidenciaVerticalSection";
import { EXTENSIONS, MANIFEST } from "@/lib/manifest";
import {
  CERTAINTY_LEVELS,
  CONTRATO_FIELDS,
  DISPUTE_RESOLUTION_FLOW,
  DOSSIER_STATES,
  EXTENSIONS_COPY,
  SETTLEMENT_STATES,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Extensiones — Servicialo",
  description:
    "Extensiones del protocolo Servicialo con su madurez explícita: Evidence Profiles, Settlement, Disputes, Delegated Agency, Network Intelligence, State Dimensions, Proof of Service y Webhooks.",
};

const MATURITY_LEGEND: { m: MaturityVariant; desc: string }[] = [
  { m: "draft", desc: "Propuesta de diseño. Puede cambiar o retirarse. No es requisito de conformance." },
  { m: "experimental", desc: "Implementada al menos parcialmente; interfaz inestable." },
  { m: "candidate", desc: "Interfaz estable; espera adopción de más de una implementación." },
  { m: "stable", desc: "Interfaz congelada; romperla exige versión mayor del protocolo." },
  { m: "deprecated", desc: "Programada para remoción; no adoptar." },
];

function docHref(doc: string | null): string | null {
  if (!doc) return null;
  if (doc.startsWith("public/spec/")) {
    return `https://spec.servicialo.com/${doc.slice("public/spec/".length)}`;
  }
  return `https://github.com/servicialo/mcp-server/blob/main/${doc}`;
}

export default function ExtensionsPage() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <PageHeader
        tag="Extensiones"
        title="Extensiones del protocolo"
        subtitle="El núcleo del protocolo es pequeño: objetos, dimensiones y ciclo de vida. Las capacidades adicionales se definen como extensiones con madurez explícita — una extensión en borrador o experimental nunca se presenta como capacidad estable."
      />

      {/* Leyenda de madurez */}
      <div className="bg-surface rounded-[14px] border border-border p-5 mb-10">
        <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
          Niveles de madurez
        </div>
        <div className="flex flex-col gap-2">
          {MATURITY_LEGEND.map(({ m, desc }) => (
            <div key={m} className="flex items-start gap-3">
              <div className="w-28 shrink-0 pt-0.5">
                <MaturityBadge maturity={m} />
              </div>
              <div className="text-[13px] text-text-muted leading-[1.6]">{desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border text-[12px] text-text-dim leading-[1.6]">
          El registro canónico vive en{" "}
          <a
            href="https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            protocol/manifest.yaml
          </a>{" "}
          (PROTOCOL.md §15.6) y esta página se genera desde él.
        </div>
      </div>

      {/* Extensiones */}
      <div className="flex flex-col gap-10 mb-14">
        {EXTENSIONS.map((ext) => {
          const copy = EXTENSIONS_COPY[ext.id];
          const href = docHref(ext.doc);
          return (
            <section key={ext.id} id={ext.id} className="scroll-mt-20">
              <div className="bg-surface rounded-[20px] border border-border p-5 md:p-7">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="font-serif text-[22px] md:text-[26px] text-text leading-[1.2]">
                    {ext.name}
                  </h2>
                  <MaturityBadge maturity={ext.maturity} />
                </div>
                {copy && (
                  <p className="text-sm text-text-muted leading-[1.7] mb-4">
                    {copy.tagline}
                  </p>
                )}

                {copy && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
                        Qué define
                      </div>
                      <ul className="space-y-1.5">
                        {copy.defines.map((d) => (
                          <li key={d} className="text-[13px] text-text-body leading-[1.6] flex gap-2">
                            <span className="text-text-dim shrink-0">—</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
                        Estado real
                      </div>
                      <div className="text-[13px] text-text-muted leading-[1.7]">
                        {copy.status}
                      </div>
                      {ext.note && (
                        <div className="mt-2 text-[12px] text-text-dim leading-[1.6] italic">
                          {ext.note}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-accent hover:text-text transition-colors"
                  >
                    Especificación → {ext.doc}
                  </a>
                )}
                {!href && (
                  <span className="font-mono text-[11px] text-text-dim">
                    Sin documento de especificación todavía (en diseño)
                  </span>
                )}
              </div>

              {/* Contenido rico por extensión */}
              {ext.id === "evidence-profiles" && (
                <div className="mt-6">
                  <EvidenciaVerticalSection />
                  <div className="bg-surface rounded-[14px] border border-border p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em]">
                        Gradiente de certeza (Proof of Service)
                      </div>
                      <MaturityBadge maturity="draft" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {CERTAINTY_LEVELS.map((l) => (
                        <div key={l.level} className="flex items-center gap-3 text-[13px]">
                          <span className="font-mono font-semibold text-accent w-7 shrink-0">
                            {l.level}
                          </span>
                          <span className="text-text">{l.name}</span>
                          <span className="text-text-dim hidden md:inline">— {l.desc}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[12px] text-text-muted leading-[1.6]">
                      El nivel describe la evidencia disponible; la
                      acreditación es una dimensión aparte, definida por
                      política — una entrega puede acreditarse en cualquier
                      nivel, con o sin pago. Ver{" "}
                      <a href="#proof-of-service" className="text-accent hover:underline">
                        Prueba de Servicio
                      </a>
                      .
                    </div>
                  </div>
                </div>
              )}

              {ext.id === "disputes" && (
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <div className="bg-surface rounded-[14px] border border-border p-5">
                    <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
                      Flujo objetivo (diseño)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {DISPUTE_RESOLUTION_FLOW.map((s) => (
                        <div key={s.id} className="rounded-xl border border-border-light p-4">
                          <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-1.5">
                            Paso {s.step} · {s.actor}
                          </div>
                          <div className="font-mono text-[13px] font-semibold text-text mb-1.5">
                            {s.label}
                          </div>
                          <div className="text-[12px] text-text-muted leading-[1.6]">
                            {s.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-[13px] text-text-body leading-[1.7]">
                      <span className="font-semibold text-text">Objetivo de diseño:</span>{" "}
                      automatizar la resolución de los casos cuya evidencia
                      satisface reglas previamente acordadas. El arbitraje por
                      pares del mismo vertical es investigación —{" "}
                      <a href="/vision#arbitraje" className="text-accent hover:underline">
                        ver /vision
                      </a>
                      .
                    </div>
                  </div>
                  <div className="bg-surface rounded-[14px] border border-border p-5">
                    <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
                      Campos del contrato pre-acordado (ilustrativos)
                    </div>
                    <div className="flex flex-col gap-2">
                      {CONTRATO_FIELDS.map((f) => (
                        <div key={f.field} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-1 md:gap-4 py-1.5 border-b border-border-light last:border-0">
                          <div className="font-mono text-[12px] text-accent">{f.field}</div>
                          <div>
                            <div className="text-[13px] text-text-body leading-[1.6]">{f.desc}</div>
                            <div className="text-[11px] text-text-dim italic mt-0.5">{f.example}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-[12px] text-text-dim leading-[1.6]">
                      Campos ilustrativos — cada implementación define sus
                      políticas; el protocolo define la estructura.
                    </div>
                  </div>
                </div>
              )}

              {ext.id === "network-intelligence" && (
                <div className="mt-4 text-[13px] text-text-muted leading-[1.7]">
                  La telemetría agregada en vivo se publica en{" "}
                  <a href="/network" className="text-accent hover:underline">/network</a>.
                  La red es opcional: una implementación es conforme sin
                  contribuir ni leer datos de la red.
                </div>
              )}

              {ext.id === "proof-of-service" && (
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <div className="bg-surface rounded-[14px] border border-border p-5">
                    <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
                      B · Estado del expediente — acreditación según política
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
                      {DOSSIER_STATES.map((s) => (
                        <div
                          key={s.id}
                          className={`rounded-[12px] py-3 px-4 border ${
                            s.id === "accredited" ? "border-green/40" : "border-border-light"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                s.id === "accredited"
                                  ? "text-green"
                                  : s.exception
                                    ? "text-text-dim"
                                    : "text-accent"
                              }`}
                            >
                              {s.id}
                            </span>
                            <span className="font-serif text-[15px] text-text">{s.name}</span>
                          </div>
                          <div className="text-[12px] text-text-muted leading-[1.6]">
                            {s.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[12px] text-text-muted leading-[1.7]">
                      La acreditación depende de una política
                      (accreditation_policy: evidencia y atestaciones
                      requeridas, nivel mínimo de certeza, excepciones). Una
                      Prueba de Servicio puede quedar acreditada en L1, L2, L3
                      o L4 — el pago no es prerrequisito de la acreditación.
                      El nivel de certeza (dimensión A) se describe arriba, en
                      el{" "}
                      <a href="#evidence-profiles" className="text-accent hover:underline">
                        gradiente de certeza
                      </a>
                      .
                    </div>
                  </div>

                  <div className="bg-surface rounded-[14px] border border-border p-5">
                    <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-3">
                      C · Estado de liquidación — los movimientos financieros
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {SETTLEMENT_STATES.map((s) => (
                        <span
                          key={s.id}
                          title={s.desc}
                          className="font-mono text-[11px] text-text-body bg-surface-alt border border-border rounded-full px-3 py-1.5 cursor-help"
                        >
                          {s.id}
                        </span>
                      ))}
                    </div>
                    <div className="text-[12px] text-text-muted leading-[1.7]">
                      La liquidación corre en su propio ciclo — puede ocurrir
                      antes, después o nunca respecto de la entrega. Un pago
                      conciliado no prueba por sí solo la calidad ni el alcance
                      entregado, y una devolución no des-hace la entrega. Los
                      estados son los de la dimensión{" "}
                      <code className="font-mono text-[11px]">financial</code>{" "}
                      de la extensión{" "}
                      <a href="#state-dimensions" className="text-accent hover:underline">
                        state-dimensions
                      </a>
                      .
                    </div>
                  </div>

                  <div className="bg-surface rounded-[14px] border border-border p-5">
                    <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">
                      Regla de presentación
                    </div>
                    <div className="text-[13px] text-text-body leading-[1.8]">
                      La Prueba de Servicio nunca se muestra desnuda: cualquier
                      componente que la represente muestra a la vez su nivel de
                      certeza (L1–L4) y su estado de expediente. Presentar la
                      liquidación como si fuera la certeza sugiere que más pago
                      equivale a más verdad.
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mb-14 bg-surface rounded-[14px] py-4 px-5 border border-border text-[12px] text-text-dim leading-[1.6]">
        Operaciones especificadas pero no implementadas en el servidor de
        referencia ({MANIFEST.specified_unimplemented_tools.map((t) => t.name.split(".")[0]).filter((v, i, a) => a.indexOf(v) === i).join(".*, ")}.*):
        se listan como <code className="font-mono">specified_unimplemented_tools</code>{" "}
        en el manifest y CI falla si una de ellas aparece en código sin
        promoverse al registro de tools.
      </div>

      <Footer />
    </div>
  );
}
