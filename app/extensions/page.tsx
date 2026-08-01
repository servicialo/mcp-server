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
  EXTENSIONS_COPY,
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
                          <span className={`ml-auto font-mono text-[10px] uppercase px-2 py-0.5 rounded-full shrink-0 ${l.estado === "Acreditable" ? "bg-green/15 text-green" : "bg-surface-alt text-text-dim"}`}>
                            {l.estado}
                          </span>
                        </div>
                      ))}
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
