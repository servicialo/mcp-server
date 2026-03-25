import type { Metadata } from "next";
import Link from "next/link";
import { getNetworkStats } from "@/lib/telemetry-stats";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Network Stats — Servicialo",
  description:
    "Live statistics from the Servicialo protocol network: active nodes, version adoption, and daily activity.",
  openGraph: {
    title: "Network Stats — Servicialo",
    description:
      "Live statistics from the Servicialo protocol network.",
  },
};

export default async function NetworkPage() {
  const stats = await getNetworkStats();
  const maxDaily = Math.max(...stats.dailyChart.map((d) => d.count), 1);

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-accent transition-colors mb-8"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver al inicio
      </Link>

      {/* Header */}
      <section className="mb-14 md:mb-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
          Protocol telemetry
        </div>
        <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
          Network Stats
        </h1>
        <p className="text-[15px] md:text-lg text-text-muted leading-[1.7] max-w-[600px]">
          Anonymous, aggregate telemetry from MCP server nodes running the
          Servicialo protocol. Updated every 60 seconds.
        </p>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-14">
        <KpiCard label="Total pings" value={stats.totalPings.toLocaleString()} />
        <KpiCard label="Unique nodes (24 h)" value={String(stats.uniqueNodes24h)} />
        <KpiCard label="Unique nodes (7 d)" value={String(stats.uniqueNodes7d)} />
      </section>

      {/* Version breakdown */}
      {stats.versionBreakdown.length > 0 && (
        <section className="mb-14">
          <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
            Version adoption
          </h2>
          <div className="space-y-2">
            {stats.versionBreakdown.map((v) => {
              const pct = stats.totalPings > 0 ? Math.round((v.count / stats.totalPings) * 100) : 0;
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
            Daily pings (last 30 days)
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
      {stats.totalPings === 0 && stats.uniqueNodes24h === 0 && stats.dailyChart.length === 0 && (
        <div className="text-center py-20 text-text-muted text-sm">
          No telemetry data yet. Nodes report in when they initialize.
        </div>
      )}

      {/* Footer note */}
      <p className="font-mono text-[10px] text-text-dim leading-relaxed">
        Telemetry is anonymous and opt-in. Each MCP server node sends a single
        ping on initialization containing only: event type, protocol version,
        and a random node ID. No personal or organizational data is collected.
      </p>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-5 bg-surface">
      <div className="font-mono text-[10px] text-text-dim uppercase tracking-[0.1em] mb-2">
        {label}
      </div>
      <div className="font-serif text-[36px] md:text-[44px] text-text leading-none tracking-[-0.02em]">
        {value}
      </div>
    </div>
  );
}
