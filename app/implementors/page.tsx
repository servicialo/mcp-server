import type { Metadata } from "next";
import { getVerifiedImplementors } from "@/lib/telemetry-stats";
import type { VerifiedImplementor } from "@/lib/telemetry-stats";
import { PageHeader } from "@/components/PageHeader";
import { MaturityBadge } from "@/components/MaturityBadge";
import { TierBadge, type ImplementationTier } from "@/components/TierBadge";
import { DarkCard } from "@/components/DarkCard";
import { Footer } from "@/components/Footer";
import { IMPLEMENTATIONS, MANIFEST, PROFILES, TOOL_COUNTS } from "@/lib/manifest";
import { OWN_HTTP_SURFACE } from "@/lib/data";

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
    def: "Implementación mantenida por el proyecto que demuestra el protocolo en operación (Coordinalo). No define el protocolo: la fuente normativa es la especificación, sus schemas y el manifest.",
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
          <span>{impl.node_count} hosts únicos</span>
        )}
      </div>
    </div>
  );
}

/**
 * Per-profile coverage of the reference implementation, derived entirely from
 * protocol/manifest.yaml: implemented operations vs. specified-but-
 * unimplemented operations. Never hand-written — "Completa" only appears
 * when the manifest lists no pending operation for the profile.
 */
function profileCoverage() {
  return PROFILES.map((p) => {
    const implemented = MANIFEST.tools.filter((t) => t.profile === p.id).length;
    const pending = MANIFEST.specified_unimplemented_tools.filter(
      (t) => t.profile === p.id
    ).length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      implemented,
      total: implemented + pending,
      complete: pending === 0,
    };
  });
}

export default async function ImplementorsPage() {
  const implementors = await getVerifiedImplementors();
  const coordinalo = IMPLEMENTATIONS.find((i) => i.id === "coordinalo");
  const coverage = profileCoverage();
  const stableComplete = coverage.filter((c) => c.status === "stable" && c.complete);

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

      {/* Reference implementation — always listed, coverage derived from the manifest */}
      <section className="mb-14">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Implementación de referencia
        </h2>
        <div className="rounded-xl border border-border p-6 bg-surface mb-4">
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
            Coordinalo es la implementación de referencia de Servicialo, en
            producción desde {coordinalo?.since ?? "2026-03-31"} (vertical
            salud). Implementa completo el núcleo estable (
            {stableComplete.map((c) => c.name).join(", ")}) y ofrece cobertura
            parcial o experimental de los perfiles adicionales, según su
            manifest de conformidad.
          </p>
          <div className="flex flex-wrap gap-3 font-mono text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="text-base leading-none">{countryFlag('CL')}</span>
              Chile
            </span>
          </div>
        </div>

        {/* Coverage matrix — derived from protocol/manifest.yaml */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium">Perfil</th>
                <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium">Estado</th>
                <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium">Cobertura</th>
                <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium">Verificación</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 font-mono text-xs text-text">{c.name}</td>
                  <td className="px-4 py-2.5"><MaturityBadge maturity={c.status} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">
                    {c.complete
                      ? `Completa — ${c.implemented}/${c.total} operaciones`
                      : `Parcial — ${c.implemented} de ${c.total} operaciones`}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-text-muted">Manual</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-text-dim leading-[1.6]">
          La matriz se deriva de{" "}
          <a
            href="https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            protocol/manifest.yaml
          </a>{" "}
          (operaciones implementadas vs. especificadas) — no se edita a mano.
          Conformance: {coordinalo?.conformance ?? "revisión manual; suite automatizada en el roadmap"}
        </p>
      </section>

      {/* Telemetry-verified implementors, when any exist */}
      {implementors.length > 0 && (
        <section className="mb-14">
          <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
            Implementaciones verificadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {implementors.map((impl) => (
              <ImplementorCard key={impl.impl_name} impl={impl} />
            ))}
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

      {/* Conectar un agente — no requiere implementar el protocolo */}
      <section id="agentes" className="mb-14 scroll-mt-20">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Conectar un agente
        </h2>
        <p className="text-[14px] text-text-body leading-relaxed mb-4">
          No necesitas implementar el protocolo para usarlo: un agente puede
          conectarse a cualquier implementación existente mediante el binding
          MCP de referencia o el perfil HTTP.
        </p>

        <DarkCard label="Modo descubrimiento" className="mb-3">
          <div className="font-mono text-[10px] text-white/40 -mt-2 mb-4">
            Sin credenciales — {TOOL_COUNTS.public} herramientas públicas:
            buscar organizaciones, listar servicios, consultar disponibilidad
          </div>
          <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
            <div><span className="text-[#5C6370]">{"// Sin credenciales — modo descubrimiento"}</span></div>
            <div><span className="text-[#98C379]">npx -y @servicialo/mcp-server</span></div>
          </pre>
        </DarkCard>

        <DarkCard label="Modo autenticado" className="mb-3">
          <div className="font-mono text-[10px] text-white/40 -mt-2 mb-4">
            Con credenciales — {TOOL_COUNTS.total} herramientas en total:
            agendar, registrar entrega y evidencia, consultar cobros
          </div>
          <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
            <div><span className="text-[#5C6370]">{"// Configuración en un cliente MCP (p. ej. Claude Desktop)"}</span></div>
            <div>{"{"}</div>
            <div>  <span className="text-[#7EC8E3]">&quot;mcpServers&quot;</span>: {"{"}</div>
            <div>    <span className="text-[#7EC8E3]">&quot;servicialo&quot;</span>: {"{"}</div>
            <div>      <span className="text-[#7EC8E3]">&quot;command&quot;</span>: <span className="text-[#98C379]">&quot;npx&quot;</span>,</div>
            <div>      <span className="text-[#7EC8E3]">&quot;args&quot;</span>: [<span className="text-[#98C379]">&quot;-y&quot;</span>, <span className="text-[#98C379]">&quot;@servicialo/mcp-server&quot;</span>],</div>
            <div>      <span className="text-[#7EC8E3]">&quot;env&quot;</span>: {"{"}</div>
            <div>        <span className="text-[#7EC8E3]">&quot;SERVICIALO_API_KEY&quot;</span>: <span className="text-[#98C379]">&quot;tu_api_key&quot;</span>,</div>
            <div>        <span className="text-[#7EC8E3]">&quot;SERVICIALO_ORG_ID&quot;</span>:  <span className="text-[#98C379]">&quot;tu_org_id&quot;</span></div>
            <div>      {"}"}</div>
            <div>    {"}"}</div>
            <div>  {"}"}</div>
            <div>{"}"}</div>
          </pre>
          <div className="mt-3 font-mono text-[10px] text-white/35 leading-relaxed">
            Las credenciales las obtiene cada organización desde la plataforma
            Servicialo-compatible que utilice.
          </div>
        </DarkCard>

        <DarkCard label="Superficie HTTP de servicialo.com" className="mb-3">
          <div className="font-mono text-[10px] text-white/40 -mt-2 mb-5">
            Resolver + descubrimiento. El protocolo no prescribe rutas HTTP —
            el binding normativo es spec/HTTP_PROFILE.md
          </div>
          <div className="grid gap-1.5">
            {OWN_HTTP_SURFACE.map((ep) => (
              <div key={ep.path + ep.method} className="flex items-baseline gap-2">
                <span
                  className={`font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    ep.method === "GET"
                      ? "text-[#98C379] bg-[#98C379]/10"
                      : "text-[#E5C07B] bg-[#E5C07B]/10"
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-[10px] md:text-[11px] text-white/60 shrink-0">
                  {ep.path}
                </span>
                <span className="font-mono text-[10px] text-white/30 leading-relaxed hidden md:inline">
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap gap-4">
            <a
              href="https://github.com/servicialo/mcp-server/blob/main/spec/HTTP_PROFILE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-white/40 hover:text-white/70 transition-colors"
            >
              Perfil HTTP normativo (spec/HTTP_PROFILE.md) &rarr;
            </a>
            <a
              href="/spec#tools"
              className="font-mono text-[10px] text-white/40 hover:text-white/70 transition-colors"
            >
              Lista completa de tools &rarr;
            </a>
          </div>
        </DarkCard>
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
