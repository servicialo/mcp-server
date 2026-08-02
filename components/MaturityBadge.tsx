export type MaturityVariant =
  | "stable"
  | "candidate"
  | "experimental"
  | "draft"
  | "deprecated"
  | "vision"
  | "research"
  | "available"
  | "design";

const STYLES: Record<MaturityVariant, string> = {
  stable: "bg-green-soft text-green",
  available: "bg-green-soft text-green",
  candidate: "bg-blue-soft text-blue",
  experimental: "bg-accent-soft text-accent",
  draft: "bg-purple-soft text-purple",
  design: "bg-purple-soft text-purple",
  vision: "bg-surface-alt text-text-dim",
  research: "bg-surface-alt text-text-dim",
  deprecated: "bg-surface-alt text-text-dim line-through",
};

const LABELS: Record<MaturityVariant, string> = {
  stable: "estable",
  available: "disponible hoy",
  candidate: "candidata",
  experimental: "experimental",
  draft: "borrador",
  design: "en diseño",
  vision: "visión",
  research: "investigación",
  deprecated: "obsoleta",
};

export function MaturityBadge({
  maturity,
  label,
}: {
  maturity: MaturityVariant;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] px-1.5 py-px ${STYLES[maturity]}`}
    >
      {label ?? LABELS[maturity]}
    </span>
  );
}
