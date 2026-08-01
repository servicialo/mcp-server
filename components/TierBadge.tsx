export type ImplementationTier =
  | "referencia"
  | "compatible"
  | "verificada"
  | "independiente"
  | "experimental";

const STYLES: Record<ImplementationTier, string> = {
  referencia: "bg-accent-soft text-accent",
  verificada: "bg-green-soft text-green",
  compatible: "bg-blue-soft text-blue",
  independiente: "bg-purple-soft text-purple",
  experimental: "bg-surface-alt text-text-dim",
};

export function TierBadge({ tier }: { tier: ImplementationTier }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${STYLES[tier]}`}
    >
      {tier}
    </span>
  );
}
