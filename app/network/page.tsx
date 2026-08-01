import type { Metadata } from "next";
import { getNetworkStats } from "@/lib/telemetry-stats";
import type { CountryEntry } from "@/lib/telemetry-stats";
import { WorldMap } from "@/components/WorldMap";
import { PageHeader } from "@/components/PageHeader";
import { Footer } from "@/components/Footer";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Red — Servicialo",
  description:
    "Telemetría anónima y agregada de instalaciones del servidor MCP de Servicialo. La red es opcional.",
  openGraph: {
    title: "Red — Servicialo",
    description:
      "Telemetría anónima y agregada de instalaciones del servidor MCP de Servicialo. La red es opcional.",
  },
};

const DEFINICIONES: { termino: string; def: React.ReactNode }[] = [
  {
    termino: "Inicialización registrada",
    def: "Evento de telemetría recibido cuando el software se inicializa. Se cuenta por node_id único; puede ser una instancia efímera — por ejemplo, un desarrollador probando con npx.",
  },
  {
    termino: "Host único",
    def: "Máquina o entorno técnico único detectado, deduplicado por huella criptográfica de red. El conteo más conservador — filtra reinicios de contenedores e IDs efímeros.",
  },
  {
    termino: "Nodo activo",
    def: "Un host que reportó actividad dentro de una ventana determinada (últimas 24 horas o últimos 7 días).",
  },
  {
    termino: "Organización operando",
    def: "Una organización que procesa coordinaciones reales mediante Servicialo, registrada en el resolver.",
  },
  {
    termino: "Implementación independiente",
    def: "Un producto o sistema distinto de Coordinalo que implementa el protocolo. Hoy: ninguna verificada.",
  },
  {
    termino: "Implementación conforme",
    def: (
      <>
        Una implementación que declaró perfiles, superó la revisión de
        conformance vigente (manual hoy) y está listada en{" "}
        <a href="/implementors" className="text-accent hover:underline">
          /implementors
        </a>
        .
      </>
    ),
  },
];

export default async function NetworkPage() {
  const stats = await getNetworkStats();
  const maxDaily = Math.max(...stats.dailyChart.map((d) => d.count), 1);
  const totalGeo = stats.countryBreakdown.reduce((s, c) => s + c.count, 0);

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <PageHeader
        tag="Telemetría del protocolo"
        title="La red"
        subtitle="Telemetría anónima y agregada de instalaciones del servidor MCP. La red es opcional: el protocolo funciona sin ella, y una implementación es conforme sin registrarse ni compartir datos."
      />

      {/* Qué mide esta página */}
      <section className="mb-14">
        <div className="bg-surface border border-border rounded-[14px] p-5">
          <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-4">
            Qué mide esta página
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {DEFINICIONES.map((d) => (
              <div key={d.termino}>
                <div className="font-mono text-[11px] font-semibold text-text mb-1">
                  {d.termino}
                </div>
                <p className="text-[13px] text-text-muted leading-[1.6]">
                  {d.def}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 pt-4 border-t border-border text-[12px] text-text-dim leading-[1.6]">
            Hoy existe una implementación en producción (Coordinalo). Las
            instalaciones no son adopción operacional.
          </p>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-14">
        <KpiCard
          label="Inicializaciones registradas"
          value={stats.totalInstances.toLocaleString()}
          subtitle="node_id únicos · acumulado histórico"
          tooltip="node_id únicos que reportaron un evento de inicialización. Incluye instancias efímeras (contenedores, pruebas con npx). 'Hosts únicos' deduplica por huella de red y es el conteo más conservador."
        />
        <KpiCard label="Hosts únicos" value={String(stats.uniqueHosts)} subtitle="acumulado histórico" tooltip="Máquinas o entornos únicos, deduplicados por huella criptográfica (SHA-256 de metadatos de la petición). Más conservador que el conteo de inicializaciones — filtra reinicios de contenedores e IDs efímeros." />
        <KpiCard label="Nodos activos (24 h)" value={String(stats.uniqueNodes24h)} tooltip="Hosts únicos con actividad en las últimas 24 horas." />
        <KpiCard label="Nodos activos (7 d)" value={String(stats.uniqueNodes7d)} tooltip="Hosts únicos con actividad en los últimos 7 días." />
      </section>

      {/* World map — always visible */}
      <section className="mb-14">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Hosts únicos por país
        </h2>

        <div className="mb-6">
          <WorldMap
            countryData={Object.fromEntries(
              stats.countryBreakdown.map((c) => [c.country_code, c.count])
            )}
          />
        </div>

        {/* Continent summary bar */}
        {stats.continentBreakdown.length > 0 && (
          <div className="mb-6">
            <div className="flex h-3 rounded-full overflow-hidden mb-3">
              {stats.continentBreakdown.map((c, i) => {
                const pct = totalGeo > 0 ? (c.count / totalGeo) * 100 : 0;
                return (
                  <div
                    key={c.continent}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${Math.max(pct, 1)}%`,
                      backgroundColor: CONTINENT_COLORS[i % CONTINENT_COLORS.length],
                      opacity: 0.75,
                    }}
                    title={`${c.continent}: ${c.count} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {stats.continentBreakdown.map((c, i) => (
                <span key={c.continent} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: CONTINENT_COLORS[i % CONTINENT_COLORS.length], opacity: 0.75 }}
                  />
                  {c.continent} ({c.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Country table */}
        {stats.countryBreakdown.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface-alt">
                  <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium">País</th>
                  <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium">Continente</th>
                  <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium text-right">Hosts únicos</th>
                  <th className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] px-4 py-2.5 font-medium w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {stats.countryBreakdown.map((c) => (
                  <CountryRow key={c.country_code} entry={c} total={totalGeo} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Version breakdown */}
      {stats.versionBreakdown.length > 0 && (
        <section className="mb-14">
          <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
            Versiones del paquete npm (hosts únicos por versión)
          </h2>
          <div className="space-y-2">
            {stats.versionBreakdown.map((v) => {
              const pct = stats.uniqueHosts > 0 ? Math.round((v.count / stats.uniqueHosts) * 100) : 0;
              return (
                <div key={v.version} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-muted w-20 shrink-0">
                    {v.version}
                  </span>
                  <div className="flex-1 h-5 rounded bg-surface-alt overflow-hidden">
                    <div
                      className="h-full rounded bg-accent/70"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-text-muted w-16 text-right shrink-0">
                    {pct}% ({v.count})
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 30-day bar chart */}
      {stats.dailyChart.length > 0 && (
        <section className="mb-14">
          <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
            Hosts únicos diarios (30 días)
          </h2>
          <div className="flex items-end gap-[2px] h-40">
            {stats.dailyChart.map((d) => {
              const heightPct = Math.max((d.count / maxDaily) * 100, 2);
              return (
                <div
                  key={d.date}
                  className="flex-1 group relative"
                  style={{ height: "100%" }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-accent/60 group-hover:bg-accent transition-colors"
                    style={{ height: `${heightPct}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-surface border border-border rounded px-2 py-1 font-mono text-[10px] text-text-muted whitespace-nowrap z-10">
                    {d.date}: {d.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 font-mono text-[10px] text-text-dim">
            <span>{stats.dailyChart[0]?.date}</span>
            <span>{stats.dailyChart[stats.dailyChart.length - 1]?.date}</span>
          </div>
        </section>
      )}

      {/* Empty state */}
      {stats.totalInstances === 0 && stats.uniqueNodes24h === 0 && stats.dailyChart.length === 0 && (
        <div className="text-center py-20 text-text-muted text-sm">
          Aún no hay datos de telemetría. Las instalaciones reportan al
          inicializarse.
        </div>
      )}

      {/* Privacy footnote */}
      <p className="font-mono text-[10px] text-text-dim leading-relaxed mb-14">
        La telemetría es anónima y opcional. Cada instalación del servidor MCP
        reporta al inicializarse: tipo de evento, versión del protocolo y un
        node_id aleatorio. Las instalaciones se deduplican por huella
        criptográfica (SHA-256 de metadatos de la petición) para evitar
        inflación por contenedores efímeros. Límite de 3 registros por origen
        por hora. El país se resuelve del lado del servidor — nunca se almacena
        ciudad, región ni dirección IP. Una instalación que no reporta
        telemetría sigue siendo plenamente conforme.
      </p>

      <Footer />
    </div>
  );
}

// ─── Components ───

function KpiCard({ label, value, subtitle, tooltip }: { label: string; value: string; subtitle?: string; tooltip?: string }) {
  return (
    <div className="rounded-xl border border-border p-5 bg-surface group relative">
      <div className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] mb-2 flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="cursor-help" title={tooltip}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        )}
      </div>
      <div className="font-serif text-[36px] md:text-[44px] text-text leading-none tracking-[-0.02em]">
        {value}
      </div>
      {subtitle && (
        <div className="font-mono text-[10px] text-text-dim mt-1.5">
          {subtitle}
        </div>
      )}
    </div>
  );
}

/** Country code → flag emoji (works on all modern browsers). */
function countryFlag(code: string): string {
  // Convert 2-letter country code to regional indicator symbols
  const base = 0x1f1e6 - 65; // 'A' = 65
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  return String.fromCodePoint(
    base + upper.charCodeAt(0),
    base + upper.charCodeAt(1),
  );
}

function CountryRow({ entry, total }: { entry: CountryEntry; total: number }) {
  const pct = total > 0 ? (entry.count / total) * 100 : 0;
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-surface-alt/50 transition-colors">
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-2">
          <span className="text-base leading-none">{countryFlag(entry.country_code)}</span>
          <span className="font-mono text-xs text-text">{entry.country_name}</span>
          <span className="font-mono text-[10px] text-text-dim">({entry.country_code})</span>
        </span>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-text-muted">{entry.continent}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-text-muted text-right">{entry.count}</td>
      <td className="px-4 py-2.5">
        <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
          <div
            className="h-full rounded-full bg-accent/60"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </td>
    </tr>
  );
}

const CONTINENT_COLORS = [
  'var(--color-accent)',
  'var(--color-green)',
  'var(--color-blue)',
  'var(--color-purple)',
  '#e4a853',
  '#e06c75',
];
