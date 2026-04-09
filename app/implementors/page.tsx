import type { Metadata } from "next";
import Link from "next/link";
import { getVerifiedImplementors } from "@/lib/telemetry-stats";
import type { VerifiedImplementor } from "@/lib/telemetry-stats";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Verified Implementors — Servicialo",
  description:
    "Organizations and platforms that have implemented the Servicialo protocol and been verified by the community.",
  openGraph: {
    title: "Verified Implementors — Servicialo",
    description:
      "Verified implementations of the Servicialo open protocol for professional service orchestration.",
  },
};

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

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-mono text-[10px] font-semibold uppercase tracking-wide">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      Verified
    </span>
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
        <VerifiedBadge />
      </div>

      <div className="flex flex-wrap gap-3 font-mono text-[11px] text-text-muted">
        {impl.country_code && impl.country_name && (
          <span className="inline-flex items-center gap-1">
            <span className="text-base leading-none">{countryFlag(impl.country_code)}</span>
            {impl.country_name}
          </span>
        )}
        {impl.node_count > 1 && (
          <span>{impl.node_count} nodes</span>
        )}
      </div>
    </div>
  );
}

export default async function ImplementorsPage() {
  const implementors = await getVerifiedImplementors();

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-accent transition-colors mb-8"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver al inicio
      </Link>

      {/* Header */}
      <section className="mb-14 md:mb-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
          Verified implementations
        </div>
        <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
          Implementors
        </h1>
        <p className="text-[15px] md:text-lg text-text-muted leading-[1.7] max-w-[600px]">
          Organizations and platforms that have implemented the Servicialo
          protocol and been verified by the community. Anonymous nodes are
          never listed here.
        </p>
      </section>

      {/* Verified implementors grid */}
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
                    href="https://coordinalo.com"
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
                <VerifiedBadge />
              </div>
              <p className="text-[13px] text-text-muted leading-relaxed mb-3">
                Reference implementation. Healthcare vertical. Full protocol coverage (phases 0-6).
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

      {/* How to get verified */}
      <section className="mb-14">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Join as a verified implementor
        </h2>
        <div className="rounded-xl border border-border p-6 bg-surface space-y-4">
          <p className="text-[14px] text-text-body leading-relaxed">
            Any node operator can optionally identify their implementation by setting three environment variables in their MCP server:
          </p>
          <pre className="font-mono text-xs bg-dark text-white rounded-lg p-4 overflow-x-auto">
{`SERVICIALO_IMPL_NAME="MyClinic Platform"
SERVICIALO_IMPL_URL="https://myclinic.com"
SERVICIALO_IMPL_CONTACT="admin@myclinic.com"`}
          </pre>
          <div className="space-y-2 text-[13px] text-text-muted leading-relaxed">
            <p>
              <strong className="text-text">1. Set the env vars</strong> — your next telemetry ping will include the identity fields. Your contact email is hashed (SHA-256) before storage and never displayed publicly.
            </p>
            <p>
              <strong className="text-text">2. Automatic review request</strong> — when a new implementation name appears, the Servicialo team is notified for manual review.
            </p>
            <p>
              <strong className="text-text">3. Verification</strong> — once verified, your implementation appears on this page with a verified badge. If not set, your node remains fully anonymous.
            </p>
          </div>
          <p className="text-[12px] text-text-dim leading-relaxed">
            For the full implementation guide, see{" "}
            <a href="https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTING.md" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              IMPLEMENTING.md
            </a>
            {" "}and{" "}
            <a href="https://github.com/servicialo/mcp-server/blob/main/IMPLEMENTORS.md" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              IMPLEMENTORS.md
            </a>.
          </p>
        </div>
      </section>

      {/* Footer note */}
      <p className="font-mono text-[10px] text-text-dim leading-relaxed">
        Verification is manual and reviewed by the Servicialo team. Only nodes
        that have passed conformance testing and provide a valid contact are
        eligible. Self-declarations without evidence of conformance are not
        accepted.
      </p>
    </div>
  );
}
