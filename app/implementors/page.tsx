import type { Metadata } from "next";
import { getVerifiedImplementors } from "@/lib/telemetry-stats";
import type { VerifiedImplementor } from "@/lib/telemetry-stats";
import { PageHeader } from "@/components/PageHeader";
import { TierBadge, type ImplementationTier } from "@/components/TierBadge";
import { Footer } from "@/components/Footer";
import { IMPLEMENTATIONS } from "@/lib/manifest";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Implementadores — Servicialo",
  description:
    "Implementaciones del protocolo Servicialo: referencia, compatible, verificada, independiente y experimental. La verificación es manual hoy; la suite automatizada de conformance es parte del roadmap.",
  openGraph: {
    title: "Implementadores — Servicialo",
    description:
      "Implementaciones del protocolo abierto Servicialo y sus niveles: referencia, compatible, verificada, independiente y experimental.",
  },
};

const NIVELES: { tier: ImplementationTier; def: string }[] = [
  {
    tier: "referencia",
    def: "Define el comportamiento canónico del protocolo (Coordinalo).",
  },
  {
    tier: "compatible",
    def: "Implementa los perfiles core; declarada por su autor con evidencia de conformance.",
  },
  {
    tier: "verificada",
    def: "Revisada manualmente por el equipo contra la checklist de conformance.",
  },
  {
    tier: "independiente",
    def: "Código propio, no derivado de la implementación de referencia.",
  },
  {
    tier: "experimental",
    def: "En desarrollo o con cobertura parcial.",
  },
];

/** Country code to flag emoji. */
function countryFlag(code: string): string {
  const base = 0x1f1e6 - 65;
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(
    base + upper.charCodeAt(0),
    base + upper.charCodeAt(1),
  );
}

function ImplementorCard({ impl }: { impl: VerifiedImplementor }) {
  return (
    <div className="rounded-xl border border-border p-6 bg-surface hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-lg text-text leading-tight">
            {impl.impl_url ? (
              <a
                href={impl.impl_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                {impl.impl_name}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1 opacity-40">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              impl.impl_name
            )}
          </h3>
        </div>
        <TierBadge tier="verificada" />
      </div>

      <p className="text-[12px] text-text-dim leading-relaxed mb-3">
        Verificación manual del equipo de Servicialo.
      </p>

      <div className="flex flex-wrap gap-3 font-mono text-[11px] text-text-muted">
        {impl.country_code && impl.country_name && (
          <span className="inline-flex items-center gap-1">
            <span className="text-base leading-none">{countryFlag(impl.country_code)}</span>
            {impl.country_name}
          </span>
        )}
        {impl.node_count > 1 && (
          <span>{impl.node_count} instalaciones</span>
        )}
      </div>
    </div>
  );
}

export default async function ImplementorsPage() {
  const implementors = await getVerifiedImplementors();
  const coordinalo = IMPLEMENTATIONS.find((i) => i.id === "coordinalo");

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <PageHeader
        tag="Implementadores"
        title="Implementaciones del protocolo"
        subtitle="Distinguimos entre implementación de referencia, compatible, verificada, independiente y experimental. La verificación es manual hoy; una suite de conformance automatizada es parte del roadmap."
      />

      {/* Niveles de implementación */}
      <section className="mb-14">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Niveles de implementación
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NIVELES.map((n) => (
            <div key={n.tier} className="rounded-xl border border-border p-5 bg-surface">
              <div className="mb-2.5">
                <TierBadge tier={n.tier} />
              </div>
              <p className="text-[13px] text-text-muted leading-[1.6]">
                {n.def}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Implementors grid */}
      {implementors.length > 0 ? (
        <section className="mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {implementors.map((impl) => (
              <ImplementorCard key={impl.impl_name} impl={impl} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-14">
          {/* Coordinalo is always listed as the reference implementation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <div className="rounded-xl border border-border p-6 bg-surface">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-serif text-lg text-text leading-tight">
                  <a
                    href={coordinalo?.url ?? "https://coordinalo.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                  >
                    Coordinalo
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline ml-1 opacity-40">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </h3>
                <TierBadge tier="referencia" />
              </div>
              <p className="text-[13px] text-text-muted leading-relaxed mb-3">
                Vertical salud. Cobertura completa de perfiles del protocolo. En
                producción desde {coordinalo?.since ?? "2026-03-31"}.
              </p>
              <div className="flex flex-wrap gap-3 font-mono text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <span className="text-base leading-none">{countryFlag('CL')}</span>
                  Chile
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cómo verificarse */}
      <section className="mb-14">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Cómo verificarse
        </h2>
        <div className="rounded-xl border border-border p-6 bg-surface space-y-4">
          <p className="text-[14px] text-text-body leading-relaxed">
            Cualquier operador de una instalación puede, opcionalmente,
            identificar su implementación configurando tres variables de entorno
            en su servidor MCP:
          </p>
          <pre className="font-mono text-xs bg-dark text-white rounded-lg p-4 overflow-x-auto">
{`SERVICIALO_IMPL_NAME="MyClinic Platform"
SERVICIALO_IMPL_URL="https://myclinic.com"
SERVICIALO_IMPL_CONTACT="admin@myclinic.com"`}
          </pre>
          <div className="space-y-2 text-[13px] text-text-muted leading-relaxed">
            <p>
              <strong className="text-text">1. Configura las variables</strong>{" "}
              — el siguiente reporte de telemetría incluirá los campos de
              identidad. El email de contacto se almacena hasheado (SHA-256) y
              nunca se muestra públicamente.
            </p>
            <p>
              <strong className="text-text">2. Revisión manual</strong> — cuando
              aparece un nuevo nombre de implementación en la telemetría, el
              equipo recibe una notificación y revisa manualmente. La
              verificación es manual hoy — la suite automatizada de conformance
              es un objetivo del roadmap, no una capacidad actual.
            </p>
            <p>
              <strong className="text-text">3. Verificación</strong> — una vez
              verificada, tu implementación aparece en esta página con su nivel.
              Si no configuras las variables, tu instalación permanece
              completamente anónima.
            </p>
          </div>
          <p className="text-[12px] text-text-dim leading-relaxed">
            La guía completa de implementación está en{" "}
            <a href="https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTING.md" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              IMPLEMENTING.md
            </a>
            {" "}y{" "}
            <a href="https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTORS.md" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              IMPLEMENTORS.md
            </a>.
          </p>
        </div>
      </section>

      {/* Footer note */}
      <p className="font-mono text-[10px] text-text-dim leading-relaxed mb-14">
        La verificación es manual: el equipo de Servicialo revisa cada
        implementación contra la checklist de conformance y exige un contacto
        válido. Las autodeclaraciones sin evidencia de conformance no se
        aceptan. Las instalaciones anónimas nunca se listan aquí.
      </p>

      <Footer />
    </div>
  );
}
