/**
 * The central relation diagram of the protocol:
 *
 *   Service Offer → Service Order → Service Delivery
 *                                     ↘ Evidence Events   ↘
 *                                     ↘ Settlement Events ↗ → Proof of Service
 *
 * Evidence and settlement evolve independently; the Proof of Service links them.
 * Desktop renders an inline SVG (CSS vars → theme-aware); mobile renders stacked chips.
 */

const NODES = {
  offer: { label: "Service Offer", gloss: "lo ofrecido" },
  order: { label: "Service Order", gloss: "lo acordado" },
  delivery: { label: "Service Delivery", gloss: "lo entregado" },
  evidence: { label: "Evidence Events", gloss: "lo observado" },
  settlement: { label: "Settlement Events", gloss: "lo liquidado" },
  proof: { label: "Proof of Service", gloss: "el expediente" },
} as const;

function SvgNode({
  x,
  y,
  w,
  node,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  node: { label: string; gloss: string };
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={54}
        rx={10}
        fill="var(--color-surface)"
        stroke={accent ? "var(--color-accent)" : "var(--color-border)"}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + w / 2}
        y={y + 24}
        textAnchor="middle"
        fontSize={12.5}
        fontFamily="var(--font-ibm-plex-mono), Menlo, monospace"
        fontWeight={600}
        fill={accent ? "var(--color-accent)" : "var(--color-text)"}
      >
        {node.label}
      </text>
      <text
        x={x + w / 2}
        y={y + 41}
        textAnchor="middle"
        fontSize={10.5}
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fill="var(--color-text-dim)"
      >
        {node.gloss}
      </text>
    </g>
  );
}

function Chip({
  node,
  accent = false,
}: {
  node: { label: string; gloss: string };
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border py-3 px-4 bg-surface ${
        accent ? "border-accent" : "border-border"
      }`}
    >
      <div
        className={`font-mono text-[12px] font-semibold ${
          accent ? "text-accent" : "text-text"
        }`}
      >
        {node.label}
      </div>
      <div className="text-[11px] text-text-dim">{node.gloss}</div>
    </div>
  );
}

export function RelationDiagram({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      {/* Desktop: SVG */}
      <div className="hidden md:block">
        <svg
          viewBox="0 0 720 330"
          className="w-full h-auto"
          role="img"
          aria-label="Diagrama: Service Offer lleva a Service Order, que lleva a Service Delivery. De la entrega derivan Evidence Events y Settlement Events de forma independiente, y ambos convergen en la Proof of Service."
        >
          <defs>
            <marker
              id="rel-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-dim)" />
            </marker>
          </defs>

          {/* Row 1: Offer → Order → Delivery */}
          <SvgNode x={20} y={20} w={180} node={NODES.offer} />
          <SvgNode x={270} y={20} w={180} node={NODES.order} />
          <SvgNode x={520} y={20} w={180} node={NODES.delivery} />
          <line x1={200} y1={47} x2={266} y2={47} stroke="var(--color-text-dim)" strokeWidth={1.2} markerEnd="url(#rel-arrow)" />
          <line x1={450} y1={47} x2={516} y2={47} stroke="var(--color-text-dim)" strokeWidth={1.2} markerEnd="url(#rel-arrow)" />

          {/* Branches: Delivery → Evidence / Settlement */}
          <SvgNode x={390} y={130} w={180} node={NODES.evidence} />
          <SvgNode x={390} y={210} w={180} node={NODES.settlement} />
          <path d="M 595 78 C 580 105, 560 120, 574 140" fill="none" stroke="var(--color-text-dim)" strokeWidth={1.2} markerEnd="url(#rel-arrow)" />
          <path d="M 620 78 C 640 140, 640 180, 574 226" fill="none" stroke="var(--color-text-dim)" strokeWidth={1.2} markerEnd="url(#rel-arrow)" />

          {/* Convergence: Evidence + Settlement (+ Order) → Proof */}
          <SvgNode x={100} y={250} w={200} node={NODES.proof} accent />
          <path d="M 386 157 C 260 170, 210 210, 202 246" fill="none" stroke="var(--color-text-dim)" strokeWidth={1.2} markerEnd="url(#rel-arrow)" />
          <path d="M 386 237 C 340 250, 320 260, 304 272" fill="none" stroke="var(--color-text-dim)" strokeWidth={1.2} markerEnd="url(#rel-arrow)" />
          <path d="M 360 60 C 300 120, 230 180, 202 246" fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="4 4" markerEnd="url(#rel-arrow)" />

          {/* Independence note */}
          <text
            x={20}
            y={175}
            fontSize={10.5}
            fontFamily="var(--font-ibm-plex-mono), Menlo, monospace"
            fill="var(--color-text-dim)"
          >
            <tspan x={20} dy={0}>evidencia y liquidación evolucionan</tspan>
            <tspan x={20} dy={15}>de forma independiente —</tspan>
            <tspan x={20} dy={15}>sin orden total entre dimensiones</tspan>
          </text>
        </svg>
      </div>

      {/* Mobile: stacked chips */}
      <div className="md:hidden flex flex-col gap-2">
        <Chip node={NODES.offer} />
        <div className="text-center text-text-dim text-sm leading-none">↓</div>
        <Chip node={NODES.order} />
        <div className="text-center text-text-dim text-sm leading-none">↓</div>
        <Chip node={NODES.delivery} />
        <div className="flex justify-center gap-10 text-text-dim text-sm leading-none">
          <span>↙</span>
          <span>↘</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Chip node={NODES.evidence} />
          <Chip node={NODES.settlement} />
        </div>
        <div className="text-[11px] text-text-dim text-center font-mono py-1">
          evolucionan de forma independiente
        </div>
        <div className="flex justify-center gap-10 text-text-dim text-sm leading-none">
          <span>↘</span>
          <span>↙</span>
        </div>
        <Chip node={NODES.proof} accent />
      </div>
    </div>
  );
}
